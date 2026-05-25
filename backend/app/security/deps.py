"""FastAPI dependencies for retrieving the current user from JWT."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.session import AuthSession
from app.models.user import User
from app.security.jwt import TokenError, decode_token


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/verify-code", auto_error=False)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_token(token, expected_type="access")
    except TokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    try:
        user_id = uuid.UUID(payload["sub"])
        session_id = uuid.UUID(payload["sid"])
    except (KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token payload.",
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

    idle_cutoff = datetime.now(timezone.utc) - timedelta(
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

    session.last_active_at = datetime.now(timezone.utc)
    db.add(session)
    db.commit()

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is unavailable.",
        )
    return user
