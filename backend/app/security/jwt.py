"""JWT helpers for access and refresh tokens."""

from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Tuple

from jose import JWTError, jwt

from app.config import settings


class TokenError(Exception):
    """Raised when a token cannot be issued or verified."""


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(
    *,
    user_id: uuid.UUID,
    session_id: uuid.UUID,
    expires_minutes: int | None = None,
) -> Tuple[str, datetime]:
    expires_at = _now() + timedelta(
        minutes=expires_minutes or settings.access_token_expire_minutes
    )
    payload: Dict[str, Any] = {
        "sub": str(user_id),
        "sid": str(session_id),
        "type": "access",
        "iat": int(_now().timestamp()),
        "exp": int(expires_at.timestamp()),
        "jti": secrets.token_hex(16),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, expires_at


def create_refresh_token(
    *,
    user_id: uuid.UUID,
    session_id: uuid.UUID,
    expires_minutes: int | None = None,
) -> Tuple[str, datetime]:
    expires_at = _now() + timedelta(
        minutes=expires_minutes or settings.refresh_token_expire_minutes
    )
    payload: Dict[str, Any] = {
        "sub": str(user_id),
        "sid": str(session_id),
        "type": "refresh",
        "iat": int(_now().timestamp()),
        "exp": int(expires_at.timestamp()),
        "jti": secrets.token_hex(16),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, expires_at


def decode_token(token: str, *, expected_type: str | None = None) -> Dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as exc:
        raise TokenError(f"Invalid token: {exc}") from exc
    if expected_type is not None and payload.get("type") != expected_type:
        raise TokenError("Unexpected token type.")
    return payload
