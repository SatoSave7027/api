import uuid
from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl


class LinkCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    url: HttpUrl
    description: str | None = Field(default=None, max_length=1000)
    image_file_id: uuid.UUID | None = None


class LinkUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    url: HttpUrl | None = None
    description: str | None = Field(default=None, max_length=1000)
    image_file_id: uuid.UUID | None = None


class LinkResponse(BaseModel):
    id: uuid.UUID
    title: str
    url: str
    description: str | None
    image_file_id: uuid.UUID | None
    image_url: str | None
    created_at: datetime
    updated_at: datetime
