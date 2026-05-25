from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional


class LinkCreate(BaseModel):
    title: str
    url: str
    description: Optional[str] = None
    image_id: Optional[str] = None


class LinkUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    image_id: Optional[str] = None


class ImageInfo(BaseModel):
    id: str
    url: str

    class Config:
        from_attributes = True


class LinkResponse(BaseModel):
    id: str
    user_id: str
    title: str
    url: str
    description: Optional[str] = None
    image_id: Optional[str] = None
    image: Optional[ImageInfo] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
