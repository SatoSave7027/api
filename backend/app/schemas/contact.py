import uuid
from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: str | None = Field(default=None, max_length=64)
    telegram_username: str | None = Field(default=None, max_length=64)
    description: str | None = Field(default=None, max_length=1000)
    avatar_file_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def validate_communication(self) -> "ContactCreate":
        if not self.phone and not self.telegram_username:
            raise ValueError("Either phone or telegram_username must be provided.")
        return self


class ContactUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    phone: str | None = Field(default=None, max_length=64)
    telegram_username: str | None = Field(default=None, max_length=64)
    description: str | None = Field(default=None, max_length=1000)
    avatar_file_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def validate_communication(self) -> "ContactUpdate":
        if self.phone is None and self.telegram_username is None:
            return self
        if not self.phone and not self.telegram_username:
            raise ValueError("Either phone or telegram_username must be provided.")
        return self


class ContactResponse(BaseModel):
    id: uuid.UUID
    name: str
    phone: str | None
    telegram_username: str | None
    description: str | None
    avatar_file_id: uuid.UUID | None
    avatar_url: str | None
    created_at: datetime
    updated_at: datetime
