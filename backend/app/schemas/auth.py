import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class AuthRequestCodeRequest(BaseModel):
    email: EmailStr


class AuthVerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)


class RefreshRequest(BaseModel):
    refresh_token: str | None = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    created_at: datetime


class TokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
