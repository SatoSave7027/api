"""Authentication service: user creation, session and token management."""

from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.session import AuthSession
from app.models.user import User
from app.schemas.auth import TokenPair
from app.security.hashing import hash_refresh_token, verify_refresh_token
from app.security.jwt import (
    TokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def get_or_create_user(db: Session, *, email: str) -> User:
    norm_email = email.strip().lower()
    existing = db.execute(
        select(User).where(User.email == norm_email)
    ).scalar_one_or_none()
    if existing is not None:
        return existing
    user = User(email=norm_email, is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _build_token_pair(
    *, user_id: uuid.UUID, session_id: uuid.UUID
) -> tuple[str, datetime, str, datetime]:
    access_token, access_exp = create_access_token(
        user_id=user_id, session_id=session_id
    )
    refresh_token, refresh_exp = create_refresh_token(
        user_id=user_id, session_id=session_id
    )
    return access_token, access_exp, refresh_token, refresh_exp


def start_session(
    db: Session,
    *,
    user: User,
    user_agent: str = "",
    ip_address: str = "",
) -> TokenPair:
    """Create a new auth session and issue a token pair."""

    session = AuthSession(
        user_id=user.id,
        refresh_token_hash="",
        user_agent=user_agent[:512],
        ip_address=ip_address[:64],
    )
    db.add(session)
    db.flush()

    access_token, access_exp, refresh_token, refresh_exp = _build_token_pair(
        user_id=user.id, session_id=session.id
    )
    session.refresh_token_hash = hash_refresh_token(refresh_token)
    session.last_active_at = _utcnow()
    db.add(session)
    db.commit()
    db.refresh(session)

    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=access_exp,
        refresh_expires_at=refresh_exp,
    )


def refresh_session(db: Session, *, refresh_token: str) -> TokenPair:
    """Rotate the refresh token within an active session."""

    try:
        payload = decode_token(refresh_token, expected_type="refresh")
    except TokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

    try:
        user_id = uuid.UUID(payload["sub"])
        session_id = uuid.UUID(payload["sid"])
    except (KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed refresh token.",
        ) from exc

    session = db.execute(
        select(AuthSession).where(
            AuthSession.id == session_id,
            AuthSession.user_id == user_id,
            AuthSession.revoked.is_(False),
        )
    ).scalar_one_or_none()

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session is no longer valid.",
        )

    if not verify_refresh_token(refresh_token, session.refresh_token_hash):
        session.revoked = True
        db.add(session)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked.",
        )

    idle_cutoff = _utcnow() - timedelta(
        minutes=settings.session_idle_timeout_minutes
    )
    last_active = session.last_active_at
    if last_active.tzinfo is None:
        last_active = last_active.replace(tzinfo=timezone.utc)
    if last_active < idle_cutoff:
        session.revoked = True
        db.add(session)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired due to inactivity. Please log in again.",
        )

    access_token, access_exp, new_refresh, refresh_exp = _build_token_pair(
        user_id=user_id, session_id=session_id
    )
    session.refresh_token_hash = hash_refresh_token(new_refresh)
    session.last_active_at = _utcnow()
    db.add(session)
    db.commit()

    return TokenPair(
        access_token=access_token,
        refresh_token=new_refresh,
        expires_at=access_exp,
        refresh_expires_at=refresh_exp,
    )


def revoke_session(db: Session, *, session_id: uuid.UUID) -> None:
    session = db.get(AuthSession, session_id)
    if session is not None and not session.revoked:
        session.revoked = True
        db.add(session)
        db.commit()


def revoke_all_sessions_for_user(db: Session, *, user_id: uuid.UUID) -> None:
    sessions = db.execute(
        select(AuthSession).where(
            AuthSession.user_id == user_id,
            AuthSession.revoked.is_(False),
        )
    ).scalars().all()
    for session in sessions:
        session.revoked = True
        db.add(session)
    if sessions:
        db.commit()


# Re-export to keep the unused import warning silent and provide convenience.
__all__ = [
    "get_or_create_user",
    "start_session",
    "refresh_session",
    "revoke_session",
    "revoke_all_sessions_for_user",
    "secrets",
]
