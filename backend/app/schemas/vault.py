from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl, model_validator


class NoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = Field(default=None, min_length=1)


class NoteOut(BaseModel):
    id: str
    title: str
    content: str
    created_at: datetime
    updated_at: datetime


class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    phone: str | None = Field(default=None, max_length=80)
    telegram_username: str | None = Field(default=None, max_length=80)
    description: str | None = Field(default=None, max_length=2000)
    avatar_file_id: str | None = None

    @model_validator(mode="after")
    def require_phone_or_telegram(self) -> "ContactCreate":
        if not self.phone and not self.telegram_username:
            raise ValueError("phone or telegram_username is required")
        return self


class ContactUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    phone: str | None = Field(default=None, max_length=80)
    telegram_username: str | None = Field(default=None, max_length=80)
    description: str | None = Field(default=None, max_length=2000)
    avatar_file_id: str | None = None


class ContactOut(BaseModel):
    id: str
    name: str
    phone: str | None
    telegram_username: str | None
    description: str | None
    avatar_file_id: str | None
    avatar_url: str | None
    created_at: datetime
    updated_at: datetime


class LinkCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    url: HttpUrl
    description: str | None = Field(default=None, max_length=2000)
    image_file_id: str | None = None


class LinkUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    url: HttpUrl | None = None
    description: str | None = Field(default=None, max_length=2000)
    image_file_id: str | None = None


class LinkOut(BaseModel):
    id: str
    title: str
    url: str
    description: str | None
    image_file_id: str | None
    image_url: str | None
    created_at: datetime
    updated_at: datetime


class UploadOut(BaseModel):
    id: str
    url: str
    content_type: str
    size: int
    original_name: str
    created_at: datetime
