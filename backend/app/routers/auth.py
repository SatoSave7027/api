from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    RequestCodeSchema,
    VerifyCodeSchema,
    TokenSchema,
    RefreshTokenSchema,
    UserSchema,
    MessageResponse,
)
from app.services.auth import AuthService
from app.utils.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/request-code", response_model=MessageResponse)
async def request_code(
    body: RequestCodeSchema,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    result = await service.request_otp(str(body.email))
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=result["message"],
        )
    return MessageResponse(message=result["message"])


@router.post("/verify-code", response_model=TokenSchema)
async def verify_code(
    body: VerifyCodeSchema,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    tokens = await service.verify_otp(str(body.email), body.code)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired verification code",
        )
    access_token, refresh_token = tokens
    return TokenSchema(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenSchema)
async def refresh_token(
    body: RefreshTokenSchema,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    tokens = await service.refresh_tokens(body.refresh_token)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    access_token, new_refresh_token = tokens
    return TokenSchema(access_token=access_token, refresh_token=new_refresh_token)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    body: RefreshTokenSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    await service.logout(current_user.id, body.refresh_token)
    return MessageResponse(message="Successfully logged out")


@router.get("/me", response_model=UserSchema)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserSchema.model_validate(current_user)
