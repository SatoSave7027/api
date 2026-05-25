from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt

from app.config import get_settings

settings = get_settings()


def create_access_token(subject: str, session_id: str, expires_delta: timedelta | None = None) -> str:
    now = datetime.now(tz=UTC)
    expire = now + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    payload: dict[str, Any] = {
        "sub": subject,
        "sid": session_id,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise ValueError("Invalid token.") from exc
