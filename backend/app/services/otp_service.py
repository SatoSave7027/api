"""OTP issuance, verification, and rate limiting."""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from typing import Final

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.otp import OtpCode
from app.security.hashing import hash_otp, verify_otp


_OTP_ALPHABET: Final[str] = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def generate_code(length: int | None = None) -> str:
    n = length or settings.otp_length
    return "".join(secrets.choice(_OTP_ALPHABET) for _ in range(n))


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _normalize_code(code: str) -> str:
    return code.strip().upper().replace(" ", "")


def issue_otp(db: Session, *, email: str) -> tuple[OtpCode, str]:
    """Issue a new OTP for ``email``, enforcing the request cooldown."""

    norm_email = _normalize_email(email)
    cooldown_start = _utcnow() - timedelta(seconds=settings.otp_request_cooldown_seconds)

    recent = db.execute(
        select(OtpCode)
        .where(
            OtpCode.email == norm_email,
            OtpCode.created_at > cooldown_start,
            OtpCode.consumed.is_(False),
        )
        .order_by(OtpCode.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()

    if recent is not None:
        recent_created = recent.created_at
        if recent_created.tzinfo is None:
            recent_created = recent_created.replace(tzinfo=timezone.utc)
        wait = settings.otp_request_cooldown_seconds - int(
            (_utcnow() - recent_created).total_seconds()
        )
        if wait > 0:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {wait} seconds before requesting another code.",
            )

    db.execute(
        select(OtpCode)
        .where(
            OtpCode.email == norm_email,
            OtpCode.consumed.is_(False),
        )
    )
    pending = db.execute(
        select(OtpCode).where(
            OtpCode.email == norm_email,
            OtpCode.consumed.is_(False),
        )
    ).scalars().all()
    for old in pending:
        old.consumed = True
        db.add(old)

    code = generate_code()
    record = OtpCode(
        email=norm_email,
        code_hash=hash_otp(code),
        attempts=0,
        consumed=False,
        expires_at=_utcnow() + timedelta(seconds=settings.otp_ttl_seconds),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record, code


def verify_code(db: Session, *, email: str, code: str) -> bool:
    """Verify a candidate OTP. Returns ``True`` on success and consumes the code."""

    norm_email = _normalize_email(email)
    norm_code = _normalize_code(code)

    record = db.execute(
        select(OtpCode)
        .where(
            OtpCode.email == norm_email,
            OtpCode.consumed.is_(False),
        )
        .order_by(OtpCode.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active verification code. Request a new one.",
        )

    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < _utcnow():
        record.consumed = True
        db.add(record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code expired. Request a new one.",
        )

    if record.attempts >= settings.otp_max_attempts:
        record.consumed = True
        db.add(record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many incorrect attempts. Request a new verification code.",
        )

    record.attempts += 1

    if not verify_otp(norm_code, record.code_hash):
        db.add(record)
        db.commit()
        remaining = max(0, settings.otp_max_attempts - record.attempts)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incorrect verification code. {remaining} attempts remaining.",
        )

    record.consumed = True
    db.add(record)
    db.commit()
    return True
