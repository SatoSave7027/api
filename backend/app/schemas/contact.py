"""Pydantic schemas for contacts."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, model_validator


class ContactBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: Optional[str] = Field(default=None, max_length=40)
    telegram_username: Optional[str] = Field(default=None, max_length=64)
    description: Optional[str] = Field(default=None, max_length=2000)
    avatar_path: Optional[str] = Field(default=None, max_length=512)


class ContactCreate(ContactBase):
    @model_validator(mode="after")
    def require_contact_method(self) -> "ContactCreate":
        phone = (self.phone or "").strip()
        telegram = (self.telegram_username or "").strip()
        if not phone and not telegram:
            raise ValueError(
                "Either 'phone' or 'telegram_username' must be provided."
            )
        return self


class ContactUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    phone: Optional[str] = Field(default=None, max_length=40)
    telegram_username: Optional[str] = Field(default=None, max_length=64)
    description: Optional[str] = Field(default=None, max_length=2000)
    avatar_path: Optional[str] = Field(default=None, max_length=512)


class ContactOut(BaseModel):
    id: uuid.UUID
    name: str
    phone: Optional[str]
    telegram_username: Optional[str]
    description: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime
    updated_at: datetime
