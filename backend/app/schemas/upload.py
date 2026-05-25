from pydantic import BaseModel
from datetime import datetime


class UploadResponse(BaseModel):
    id: str
    user_id: str
    filename: str
    original_filename: str
    content_type: str
    file_size: int
    url: str
    created_at: datetime

    class Config:
        from_attributes = True
