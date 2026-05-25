from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class NoteCreate(BaseModel):
    title: str
    content: str


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class NoteResponse(BaseModel):
    id: str
    user_id: str
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
