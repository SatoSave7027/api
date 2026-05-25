import os
import uuid
import logging
from pathlib import Path
from typing import Optional

from fastapi import UploadFile, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.upload import Upload
from app.schemas.upload import UploadResponse

logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
}


def _get_upload_dir() -> Path:
    upload_path = Path(settings.UPLOAD_DIR)
    upload_path.mkdir(parents=True, exist_ok=True)
    return upload_path


class UploadsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upload_file(self, file: UploadFile, user_id: str, base_url: str) -> UploadResponse:
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_CONTENT_TYPES)}",
            )

        content = await file.read()
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE_MB}MB",
            )

        ext = Path(file.filename).suffix.lower() if file.filename else ".jpg"
        unique_filename = f"{uuid.uuid4()}{ext}"

        upload_dir = _get_upload_dir()
        user_dir = upload_dir / user_id
        user_dir.mkdir(parents=True, exist_ok=True)
        file_path = user_dir / unique_filename

        with open(file_path, "wb") as f:
            f.write(content)

        file_url = f"{base_url}/uploads/{user_id}/{unique_filename}"

        upload = Upload(
            user_id=user_id,
            filename=unique_filename,
            original_filename=file.filename or unique_filename,
            content_type=file.content_type,
            file_size=len(content),
            file_path=str(file_path),
            url=file_url,
        )
        self.db.add(upload)
        await self.db.flush()
        await self.db.refresh(upload)

        return UploadResponse.model_validate(upload)

    async def delete_file(self, file_id: str, user_id: str) -> bool:
        result = await self.db.execute(
            select(Upload).where(Upload.id == file_id, Upload.user_id == user_id)
        )
        upload = result.scalar_one_or_none()
        if not upload:
            return False

        try:
            if os.path.exists(upload.file_path):
                os.remove(upload.file_path)
        except Exception as e:
            logger.error(f"Failed to delete file {upload.file_path}: {e}")

        await self.db.delete(upload)
        await self.db.flush()
        return True
