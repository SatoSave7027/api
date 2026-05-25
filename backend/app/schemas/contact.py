from pydantic import BaseModel, model_validator
from datetime import datetime
from typing import Optional


class ContactCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    telegram_username: Optional[str] = None
    description: Optional[str] = None
    avatar_id: Optional[str] = None

    @model_validator(mode="after")
    def check_phone_or_telegram(self) -> "ContactCreate":
        if not self.phone and not self.telegram_username:
            raise ValueError("Either phone or telegram_username must be provided")
        return self


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    telegram_username: Optional[str] = None
    description: Optional[str] = None
    avatar_id: Optional[str] = None


class AvatarInfo(BaseModel):
    id: str
    url: str

    class Config:
        from_attributes = True


class ContactResponse(BaseModel):
    id: str
    user_id: str
    name: str
    phone: Optional[str] = None
    telegram_username: Optional[str] = None
    description: Optional[str] = None
    avatar_id: Optional[str] = None
    avatar: Optional[AvatarInfo] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
