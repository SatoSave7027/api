from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RequestCodeIn(BaseModel):
    email: EmailStr


class VerifyCodeIn(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6, pattern=r"^[A-Za-z0-9]{6}$")


class RefreshIn(BaseModel):
    refresh_token: str = Field(min_length=32)


class LogoutIn(BaseModel):
    refresh_token: str | None = None


class UserOut(BaseModel):
    id: str
    email: EmailStr
    created_at: datetime


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


class MessageOut(BaseModel):
    message: str
