"""Pydantic schemas for links."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, HttpUrl, field_validator


class LinkCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    url: str = Field(min_length=1, max_length=2048)
    description: Optional[str] = Field(default=None, max_length=2000)
    image_path: Optional[str] = Field(default=None, max_length=512)

    @field_validator("url")
    @classmethod
    def _validate_url(cls, value: str) -> str:
        candidate = value.strip()
        if not candidate.lower().startswith(("http://", "https://")):
            candidate = "https://" + candidate
        HttpUrl(candidate)
        return candidate


class LinkUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    url: Optional[str] = Field(default=None, min_length=1, max_length=2048)
    description: Optional[str] = Field(default=None, max_length=2000)
    image_path: Optional[str] = Field(default=None, max_length=512)

    @field_validator("url")
    @classmethod
    def _validate_url(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        candidate = value.strip()
        if not candidate.lower().startswith(("http://", "https://")):
            candidate = "https://" + candidate
        HttpUrl(candidate)
        return candidate


class LinkOut(BaseModel):
    id: uuid.UUID
    title: str
    url: str
    description: Optional[str]
    image_url: Optional[str]
    created_at: datetime
    updated_at: datetime
