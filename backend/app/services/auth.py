import secrets
import string
from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import utcnow
from app.models import OtpChallenge, User, UserSession
from app.schemas.auth import TokenPair, UserOut
from app.security.hashing import hmac_hash, verify_hash
from app.security.tokens import create_access_token, generate_refresh_token
from app.services.email import email_service

OTP_ALPHABET = string.ascii_letters + string.digits


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _new_otp_code() -> str:
    return "".join(secrets.choice(OTP_ALPHABET) for _ in range(6))


def request_login_code(db: Session, email: str) -> None:
    settings = get_settings()
    normalized_email = _normalize_email(email)
    now = utcnow()
    latest = db.execute(
        select(OtpChallenge).where(OtpChallenge.email == normalized_email).order_by(desc(OtpChallenge.created_at)).limit(1)
    ).scalar_one_or_none()
    if latest and (now - latest.created_at).total_seconds() < settings.otp_resend_seconds:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Please wait before requesting another code")
    hourly_count = db.execute(
        select(func.count(OtpChallenge.id)).where(
            OtpChallenge.email == normalized_email,
            OtpChallenge.created_at >= now - timedelta(hours=1),
        )
    ).scalar_one()
    if hourly_count >= settings.otp_hourly_limit:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many OTP requests")

    code = _new_otp_code()
    challenge = OtpChallenge(
        email=normalized_email,
        code_hash=hmac_hash(f"{normalized_email}:{code}", "otp"),
        expires_at=now + timedelta(minutes=settings.otp_ttl_minutes),
    )
    db.add(challenge)
    db.commit()
    email_service.send_otp(normalized_email, code)


def verify_login_code(db: Session, email: str, code: str) -> TokenPair:
    settings = get_settings()
    normalized_email = _normalize_email(email)
    now = utcnow()
    challenge = db.execute(
        select(OtpChallenge)
        .where(OtpChallenge.email == normalized_email, OtpChallenge.consumed_at.is_(None))
        .order_by(desc(OtpChallenge.created_at))
        .limit(1)
    ).scalar_one_or_none()
    if challenge is None or challenge.expires_at <= now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP code is invalid or expired")
    if challenge.attempts >= challenge.max_attempts:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many invalid OTP attempts")

    challenge.attempts += 1
    if not verify_hash(f"{normalized_email}:{code}", challenge.code_hash, "otp"):
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP code is invalid or expired")

    user = db.execute(select(User).where(User.email == normalized_email)).scalar_one_or_none()
    if user is None:
        user = User(email=normalized_email)
        db.add(user)
        db.flush()

    refresh_token = generate_refresh_token()
    session = UserSession(
        user_id=user.id,
        refresh_token_hash=hmac_hash(refresh_token, "refresh"),
        expires_at=now + timedelta(days=settings.session_lifetime_days),
        last_activity_at=now,
    )
    challenge.consumed_at = now
    db.add(session)
    db.commit()
    db.refresh(user)
    db.refresh(session)
    access_token, expires_in = create_access_token(user.id, session.id)
    return TokenPair(access_token=access_token, refresh_token=refresh_token, expires_in=expires_in, user=UserOut(id=user.id, email=user.email, created_at=user.created_at))


def refresh_session(db: Session, refresh_token: str) -> TokenPair:
    settings = get_settings()
    now = utcnow()
    session = db.execute(select(UserSession).where(UserSession.refresh_token_hash == hmac_hash(refresh_token, "refresh"))).scalar_one_or_none()
    if session is None or session.revoked_at is not None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    if session.expires_at <= now or now - session.last_activity_at > timedelta(hours=settings.session_idle_hours):
        session.revoked_at = now
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired due to inactivity")
    user = db.get(User, session.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    new_refresh_token = generate_refresh_token()
    session.refresh_token_hash = hmac_hash(new_refresh_token, "refresh")
    session.last_activity_at = now
    db.commit()
    db.refresh(user)
    db.refresh(session)
    access_token, expires_in = create_access_token(user.id, session.id)
    return TokenPair(access_token=access_token, refresh_token=new_refresh_token, expires_in=expires_in, user=UserOut(id=user.id, email=user.email, created_at=user.created_at))


def logout_session(db: Session, refresh_token: str | None, session_id: str | None = None) -> None:
    now = utcnow()
    session = None
    if refresh_token:
        session = db.execute(select(UserSession).where(UserSession.refresh_token_hash == hmac_hash(refresh_token, "refresh"))).scalar_one_or_none()
    elif session_id:
        session = db.get(UserSession, session_id)
    if session and session.revoked_at is None:
        session.revoked_at = now
        db.commit()
