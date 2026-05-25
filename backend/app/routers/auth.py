from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.schemas.auth import (
    AuthRequestCodeRequest,
    AuthVerifyCodeRequest,
    RefreshRequest,
    TokenPairResponse,
    UserResponse,
)
from app.security.dependencies import get_current_session_id, get_current_user
from app.services.auth import refresh_session, request_otp_code, revoke_session, verify_otp_code

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["auth"])


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=settings.token_cookie_name,
        value=refresh_token,
        httponly=True,
        secure=settings.app_env != "development",
        samesite="lax",
        max_age=settings.session_max_days * 24 * 3600,
        path="/",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key=settings.token_cookie_name, path="/")


@router.post("/request-code", status_code=status.HTTP_202_ACCEPTED)
def request_code(payload: AuthRequestCodeRequest, db: Session = Depends(get_db)) -> dict[str, str]:
    request_otp_code(db, payload.email)
    return {"message": "OTP code sent."}


@router.post("/verify-code", response_model=TokenPairResponse)
def verify_code(
    payload: AuthVerifyCodeRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenPairResponse:
    access_token, refresh_token, user = verify_otp_code(
        db,
        payload.email,
        payload.code,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )
    _set_refresh_cookie(response, refresh_token)
    return TokenPairResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=TokenPairResponse)
def refresh_token(
    payload: RefreshRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenPairResponse:
    token_from_body = payload.refresh_token
    token_from_cookie = request.cookies.get(settings.token_cookie_name)
    source_token = token_from_body or token_from_cookie
    if not source_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token is missing.")

    access_token, refresh_token_value, user = refresh_session(
        db,
        source_token,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )
    _set_refresh_cookie(response, refresh_token_value)
    return TokenPairResponse(
        access_token=access_token,
        refresh_token=refresh_token_value,
        user=UserResponse.model_validate(user),
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    payload: RefreshRequest,
    response: Response,
    current_user=Depends(get_current_user),
    current_session_id=Depends(get_current_session_id),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    revoke_session(
        db=db,
        user_id=current_user.id,
        session_id=current_session_id,
        refresh_token=payload.refresh_token,
    )
    _clear_refresh_cookie(response)
    return {"message": "Logged out."}


@router.get("/me", response_model=UserResponse)
def me(current_user=Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)
