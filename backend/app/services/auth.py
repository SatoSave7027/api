import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User
from app.models.otp import OTPCode
from app.models.session import UserSession
from app.security.jwt import create_access_token, create_refresh_token, decode_token
from app.security.otp import generate_otp, hash_otp, verify_otp
from app.services.email import send_otp_email

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_or_create_user(self, email: str) -> User:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            user = User(email=email)
            self.db.add(user)
            await self.db.flush()
            await self.db.refresh(user)
        return user

    async def _check_otp_rate_limit(self, user_id: str) -> bool:
        one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
        result = await self.db.execute(
            select(func.count(OTPCode.id))
            .where(OTPCode.user_id == user_id)
            .where(OTPCode.created_at >= one_hour_ago)
        )
        count = result.scalar_one()
        return count < settings.OTP_RATE_LIMIT_PER_HOUR

    async def request_otp(self, email: str) -> dict:
        user = await self._get_or_create_user(email)

        if not await self._check_otp_rate_limit(user.id):
            return {
                "success": False,
                "message": "Rate limit exceeded. Please wait before requesting another code.",
            }

        otp_plain = generate_otp()
        otp_hashed = hash_otp(otp_plain)
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.OTP_EXPIRE_MINUTES
        )

        otp_record = OTPCode(
            user_id=user.id,
            code_hash=otp_hashed,
            expires_at=expires_at,
        )
        self.db.add(otp_record)
        await self.db.flush()

        email_sent = await send_otp_email(email, otp_plain)
        if not email_sent:
            logger.warning(f"Email delivery failed for {email}, OTP was generated.")

        return {
            "success": True,
            "message": "Verification code sent to your email.",
        }

    async def verify_otp(self, email: str, code: str) -> Optional[Tuple[str, str]]:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            return None

        result = await self.db.execute(
            select(OTPCode)
            .where(OTPCode.user_id == user.id)
            .where(OTPCode.is_used == False)
            .where(OTPCode.expires_at > datetime.now(timezone.utc))
            .order_by(OTPCode.created_at.desc())
            .limit(1)
        )
        otp_record = result.scalar_one_or_none()
        if not otp_record:
            return None

        if otp_record.attempts >= settings.OTP_MAX_ATTEMPTS:
            return None

        if not verify_otp(code, otp_record.code_hash):
            otp_record.attempts += 1
            await self.db.flush()
            return None

        otp_record.is_used = True
        await self.db.flush()

        access_token = create_access_token({"sub": user.id, "email": user.email})
        refresh_token = create_refresh_token({"sub": user.id, "email": user.email})

        refresh_token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        session_expires = datetime.now(timezone.utc) + timedelta(
            hours=settings.REFRESH_TOKEN_EXPIRE_HOURS
        )
        session = UserSession(
            user_id=user.id,
            refresh_token_hash=refresh_token_hash,
            expires_at=session_expires,
            last_activity=datetime.now(timezone.utc),
        )
        self.db.add(session)
        await self.db.flush()

        return access_token, refresh_token

    async def refresh_tokens(self, refresh_token: str) -> Optional[Tuple[str, str]]:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            return None

        user_id = payload.get("sub")
        refresh_token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()

        result = await self.db.execute(
            select(UserSession)
            .where(UserSession.user_id == user_id)
            .where(UserSession.refresh_token_hash == refresh_token_hash)
            .where(UserSession.is_active == True)
        )
        session = result.scalar_one_or_none()
        if not session:
            return None

        inactivity_limit = datetime.now(timezone.utc) - timedelta(
            hours=settings.REFRESH_TOKEN_EXPIRE_HOURS
        )
        if session.last_activity < inactivity_limit:
            session.is_active = False
            await self.db.flush()
            return None

        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            return None

        new_access_token = create_access_token({"sub": user.id, "email": user.email})
        new_refresh_token = create_refresh_token({"sub": user.id, "email": user.email})

        new_refresh_hash = hashlib.sha256(new_refresh_token.encode()).hexdigest()
        session.refresh_token_hash = new_refresh_hash
        session.last_activity = datetime.now(timezone.utc)
        session.expires_at = datetime.now(timezone.utc) + timedelta(
            hours=settings.REFRESH_TOKEN_EXPIRE_HOURS
        )
        await self.db.flush()

        return new_access_token, new_refresh_token

    async def logout(self, user_id: str, refresh_token: str) -> bool:
        refresh_token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        result = await self.db.execute(
            select(UserSession)
            .where(UserSession.user_id == user_id)
            .where(UserSession.refresh_token_hash == refresh_token_hash)
        )
        session = result.scalar_one_or_none()
        if session:
            session.is_active = False
            await self.db.flush()
        return True

    async def update_session_activity(self, user_id: str) -> None:
        result = await self.db.execute(
            select(UserSession)
            .where(UserSession.user_id == user_id)
            .where(UserSession.is_active == True)
            .order_by(UserSession.last_activity.desc())
            .limit(1)
        )
        session = result.scalar_one_or_none()
        if session:
            session.last_activity = datetime.now(timezone.utc)
            await self.db.flush()
