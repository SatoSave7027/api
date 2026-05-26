from datetime import timedelta
from secrets import token_urlsafe
from typing import Any

import jwt
from fastapi import HTTPException, status

from app.config import get_settings
from app.database import utcnow


def create_access_token(user_id: str, session_id: str) -> tuple[str, int]:
    settings = get_settings()
    expires_delta = timedelta(minutes=settings.access_token_minutes)
    now = utcnow()
    payload: dict[str, Any] = {
        "sub": user_id,
        "sid": session_id,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
        "iss": settings.app_name,
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, int(expires_delta.total_seconds())


def decode_access_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm], issuer=settings.app_name)
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token") from exc
    if payload.get("type") != "access" or not payload.get("sub") or not payload.get("sid"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
    return payload


def generate_refresh_token() -> str:
    return token_urlsafe(48)
