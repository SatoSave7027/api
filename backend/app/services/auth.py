from __future__ import annotations

import secrets
import string
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.otp_code import OTPCode
from app.models.session import SessionToken
from app.models.user import User
from app.security.hashing import hash_value, verify_hash
from app.security.jwt import create_access_token
from app.services.email import send_otp_email

settings = get_settings()
OTP_ALPHABET = string.ascii_uppercase + string.digits


def _utcnow() -> datetime:
    return datetime.now(tz=UTC)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _generate_otp_code() -> str:
    return "".join(secrets.choice(OTP_ALPHABET) for _ in range(6))


def _generate_refresh_secret() -> str:
    return secrets.token_urlsafe(48)


def request_otp_code(db: Session, email: str) -> None:
    normalized_email = _normalize_email(email)
    now = _utcnow()
    hour_ago = now - timedelta(hours=1)

    recent_count = db.scalar(
        select(func.count(OTPCode.id)).where(OTPCode.email == normalized_email, OTPCode.created_at >= hour_ago)
    )
    if recent_count and recent_count >= settings.otp_request_limit_per_hour:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many OTP requests. Please try again later.",
        )

    latest_code = db.scalar(
        select(OTPCode).where(OTPCode.email == normalized_email).order_by(OTPCode.created_at.desc()).limit(1)
    )
    if latest_code is not None:
        elapsed = (now - latest_code.created_at).total_seconds()
        if elapsed < settings.otp_request_cooldown_seconds:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {int(settings.otp_request_cooldown_seconds - elapsed)} seconds before retrying.",
            )

    active_codes = db.scalars(
        select(OTPCode).where(
            OTPCode.email == normalized_email,
            OTPCode.consumed_at.is_(None),
            OTPCode.expires_at > now,
        )
    ).all()
    for active in active_codes:
        active.consumed_at = now

    otp_code = _generate_otp_code()
    otp_record = OTPCode(
        email=normalized_email,
        code_hash=hash_value(otp_code),
        attempts_left=settings.otp_max_attempts,
        expires_at=now + timedelta(minutes=settings.otp_expiration_minutes),
    )
    db.add(otp_record)
    db.flush()

    try:
        send_otp_email(normalized_email, otp_code)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to send OTP email. Check SMTP credentials.",
        ) from exc

    db.commit()


def verify_otp_code(
    db: Session,
    email: str,
    code: str,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> tuple[str, str, User]:
    normalized_email = _normalize_email(email)
    now = _utcnow()
    provided_code = code.strip().upper()

    otp_record = db.scalar(
        select(OTPCode)
        .where(
            OTPCode.email == normalized_email,
            OTPCode.consumed_at.is_(None),
            OTPCode.expires_at > now,
        )
        .order_by(OTPCode.created_at.desc())
        .limit(1)
    )
    if otp_record is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP code is invalid or expired.")

    if otp_record.attempts_left <= 0:
        otp_record.consumed_at = now
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="OTP attempts exceeded. Request a new code.",
        )

    if not verify_hash(provided_code, otp_record.code_hash):
        otp_record.attempts_left -= 1
        if otp_record.attempts_left <= 0:
            otp_record.consumed_at = now
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP code is invalid.")

    otp_record.consumed_at = now
    user = db.scalar(select(User).where(User.email == normalized_email))
    if user is None:
        user = User(email=normalized_email)
        db.add(user)
        db.flush()

    if otp_record.user_id is None:
        otp_record.user_id = user.id

    refresh_secret = _generate_refresh_secret()
    session = SessionToken(
        user_id=user.id,
        refresh_token_hash=hash_value(refresh_secret),
        user_agent=user_agent[:255] if user_agent else None,
        ip_address=ip_address[:64] if ip_address else None,
        expires_at=now + timedelta(days=settings.session_max_days),
        last_activity_at=now,
    )
    db.add(session)
    db.commit()
    db.refresh(user)
    db.refresh(session)

    access_token = create_access_token(subject=str(user.id), session_id=str(session.id))
    refresh_token = f"{session.id}.{refresh_secret}"
    return access_token, refresh_token, user


def refresh_session(
    db: Session,
    refresh_token: str,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> tuple[str, str, User]:
    now = _utcnow()

    try:
        session_id_raw, provided_secret = refresh_token.split(".", maxsplit=1)
        session_id = uuid.UUID(session_id_raw)
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token format.") from exc

    session = db.get(SessionToken, session_id)
    if session is None or session.revoked_at is not None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token is revoked.")

    if session.expires_at < now:
        session.revoked_at = now
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session has expired.")

    if session.last_activity_at < now - timedelta(hours=settings.session_idle_timeout_hours):
        session.revoked_at = now
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session inactive for too long. Login required.",
        )

    if not verify_hash(provided_secret, session.refresh_token_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")

    rotated_secret = _generate_refresh_secret()
    session.refresh_token_hash = hash_value(rotated_secret)
    session.last_activity_at = now
    session.user_agent = user_agent[:255] if user_agent else session.user_agent
    session.ip_address = ip_address[:64] if ip_address else session.ip_address

    db.commit()
    db.refresh(session)
    user = session.user
    access_token = create_access_token(subject=str(user.id), session_id=str(session.id))
    new_refresh_token = f"{session.id}.{rotated_secret}"
    return access_token, new_refresh_token, user


def revoke_session(
    db: Session,
    user_id: uuid.UUID,
    session_id: uuid.UUID | None = None,
    refresh_token: str | None = None,
) -> None:
    target_session: SessionToken | None = None
    now = _utcnow()

    if session_id is not None:
        candidate = db.get(SessionToken, session_id)
        if candidate and candidate.user_id == user_id:
            target_session = candidate

    if target_session is None and refresh_token:
        try:
            refresh_session_id = uuid.UUID(refresh_token.split(".", maxsplit=1)[0])
            candidate = db.get(SessionToken, refresh_session_id)
            if candidate and candidate.user_id == user_id:
                target_session = candidate
        except (ValueError, IndexError):
            target_session = None

    if target_session and target_session.revoked_at is None:
        target_session.revoked_at = now
        db.commit()
