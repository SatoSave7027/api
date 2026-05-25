"""Pydantic schemas for file uploads."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class UploadOut(BaseModel):
    id: uuid.UUID
    filename: str
    content_type: str
    size_bytes: int
    url: str
    storage_path: str
    created_at: datetime
