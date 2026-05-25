"""Pydantic schemas for notes."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class NoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(default="", max_length=100_000)


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    content: Optional[str] = Field(default=None, max_length=100_000)


class NoteOut(BaseModel):
    id: uuid.UUID
    title: str
    content: str
    created_at: datetime
    updated_at: datetime
