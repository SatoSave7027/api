from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.auth import LogoutIn, MessageOut, RefreshIn, RequestCodeIn, TokenPair, UserOut, VerifyCodeIn
from app.security.dependencies import bearer_scheme, get_current_user
from app.security.tokens import decode_access_token
from app.services.auth import logout_session, refresh_session, request_login_code, verify_login_code

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/request-code", response_model=MessageOut, status_code=202)
def request_code(payload: RequestCodeIn, db: Session = Depends(get_db)) -> MessageOut:
    request_login_code(db, payload.email)
    return MessageOut(message="OTP code sent")


@router.post("/verify-code", response_model=TokenPair)
def verify_code(payload: VerifyCodeIn, db: Session = Depends(get_db)) -> TokenPair:
    return verify_login_code(db, payload.email, payload.code)


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshIn, db: Session = Depends(get_db)) -> TokenPair:
    return refresh_session(db, payload.refresh_token)


@router.post("/logout", response_model=MessageOut)
def logout(
    payload: LogoutIn,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> MessageOut:
    token_payload = decode_access_token(credentials.credentials)
    logout_session(db, payload.refresh_token, token_payload.get("sid"))
    return MessageOut(message="Logged out")


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut(id=user.id, email=user.email, created_at=user.created_at)
