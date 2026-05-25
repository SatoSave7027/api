import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.security.jwt import decode_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token.")

    try:
        payload = decode_token(credentials.credentials)
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Missing subject.")
        token_type = payload.get("type")
        if token_type != "access":
            raise ValueError("Invalid token type.")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    user = db.get(User, uuid.UUID(str(user_id)))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    return user


def get_current_session_id(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)) -> uuid.UUID | None:
    if credentials is None:
        return None
    try:
        payload = decode_token(credentials.credentials)
        session_id = payload.get("sid")
        if not session_id:
            return None
        return uuid.UUID(str(session_id))
    except (ValueError, TypeError):
        return None
