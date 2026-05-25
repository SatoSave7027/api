import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UploadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    original_filename: str
    content_type: str
    size_bytes: int
    public_url: str
    created_at: datetime
