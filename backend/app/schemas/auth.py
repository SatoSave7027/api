"""Pydantic schemas for authentication endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RequestCodeIn(BaseModel):
    email: EmailStr


class RequestCodeOut(BaseModel):
    message: str = Field(default="Verification code sent to your email.")
    cooldown_seconds: int


class VerifyCodeIn(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=12)


class RefreshIn(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_at: datetime
    refresh_expires_at: datetime


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    created_at: datetime


class MessageOut(BaseModel):
    message: str
