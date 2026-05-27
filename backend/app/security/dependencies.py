from datetime import timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import ensure_utc, get_db, utcnow
from app.models import User, UserSession
from app.security.tokens import decode_access_token

bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    settings = get_settings()
    payload = decode_access_token(credentials.credentials)
    session = db.get(UserSession, payload["sid"])
    if session is None or session.revoked_at is not None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session is no longer active")

    now = utcnow()
    session_expires_at = ensure_utc(session.expires_at)
    session_last_activity_at = ensure_utc(session.last_activity_at)
    if session_expires_at <= now or now - session_last_activity_at > timedelta(hours=settings.session_idle_hours):
        session.revoked_at = now
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired due to inactivity")

    user = db.get(User, payload["sub"])
    if user is None or user.id != session.user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    session.last_activity_at = now
    db.commit()
    db.refresh(user)
    return user
