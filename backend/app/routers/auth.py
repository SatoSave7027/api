"""Authentication endpoints: OTP request/verify, refresh, logout, me."""

from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    MessageOut,
    RefreshIn,
    RequestCodeIn,
    RequestCodeOut,
    TokenPair,
    UserOut,
    VerifyCodeIn,
)
from app.security.deps import get_current_user
from app.security.jwt import TokenError, decode_token
from app.services import auth_service, otp_service
from app.services.email_service import send_otp_email


logger = logging.getLogger(__name__)


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/request-code", response_model=RequestCodeOut)
def request_code(
    payload: RequestCodeIn,
    db: Session = Depends(get_db),
) -> RequestCodeOut:
    _, code = otp_service.issue_otp(db, email=payload.email)
    ttl_minutes = max(1, settings.otp_ttl_seconds // 60)
    try:
        send_otp_email(payload.email, code, ttl_minutes=ttl_minutes)
    except Exception as exc:
        logger.exception("Failed to send OTP email to %s", payload.email)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to send verification email. Try again shortly.",
        ) from exc
    return RequestCodeOut(
        cooldown_seconds=settings.otp_request_cooldown_seconds,
    )


@router.post("/verify-code", response_model=TokenPair)
def verify_code_endpoint(
    payload: VerifyCodeIn,
    request: Request,
    db: Session = Depends(get_db),
) -> TokenPair:
    otp_service.verify_code(db, email=payload.email, code=payload.code)
    user = auth_service.get_or_create_user(db, email=payload.email)
    user_agent = request.headers.get("user-agent", "")
    client_ip = request.client.host if request.client else ""
    tokens = auth_service.start_session(
        db,
        user=user,
        user_agent=user_agent,
        ip_address=client_ip,
    )
    return tokens


@router.post("/refresh", response_model=TokenPair)
def refresh_endpoint(
    payload: RefreshIn,
    db: Session = Depends(get_db),
) -> TokenPair:
    return auth_service.refresh_session(db, refresh_token=payload.refresh_token)


@router.post("/logout", response_model=MessageOut)
def logout_endpoint(
    payload: RefreshIn,
    db: Session = Depends(get_db),
) -> MessageOut:
    try:
        decoded = decode_token(payload.refresh_token, expected_type="refresh")
    except TokenError:
        return MessageOut(message="Logged out.")
    try:
        session_id = uuid.UUID(decoded["sid"])
    except (KeyError, ValueError):
        return MessageOut(message="Logged out.")
    auth_service.revoke_session(db, session_id=session_id)
    return MessageOut(message="Logged out.")


@router.get("/me", response_model=UserOut)
def me_endpoint(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current_user)
