from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class RequestCodeSchema(BaseModel):
    email: EmailStr


class VerifyCodeSchema(BaseModel):
    email: EmailStr
    code: str


class TokenSchema(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenSchema(BaseModel):
    refresh_token: str


class UserSchema(BaseModel):
    id: str
    email: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None
