"""File upload service."""

from __future__ import annotations

import secrets
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.models.upload import UploadedFile
from app.models.user import User
from app.schemas.upload import UploadOut


ALLOWED_CONTENT_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


def _public_url(storage_path: str) -> str:
    base = settings.public_base_url.rstrip("/")
    rel = storage_path.lstrip("/")
    return f"{base}/{rel}"


def save_upload(db: Session, *, user: User, file: UploadFile) -> UploadOut:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                "Unsupported file type. Allowed: "
                + ", ".join(sorted(ALLOWED_CONTENT_TYPES.keys()))
            ),
        )

    suffix = ALLOWED_CONTENT_TYPES[file.content_type]
    upload_root = settings.upload_path
    user_dir = upload_root / str(user.id)
    user_dir.mkdir(parents=True, exist_ok=True)

    file_id = uuid.uuid4()
    filename = f"{file_id.hex}_{secrets.token_hex(4)}{suffix}"
    destination = user_dir / filename

    contents = file.file.read(settings.max_upload_size_bytes + 1)
    if len(contents) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                f"File too large. Max {settings.max_upload_size_bytes} bytes."
            ),
        )
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file.",
        )

    destination.write_bytes(contents)

    storage_path = f"{settings.upload_dir}/{user.id}/{filename}"

    record = UploadedFile(
        id=file_id,
        user_id=user.id,
        filename=file.filename or filename,
        content_type=file.content_type,
        storage_path=storage_path,
        size_bytes=len(contents),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return UploadOut(
        id=record.id,
        filename=record.filename,
        content_type=record.content_type,
        size_bytes=record.size_bytes,
        url=_public_url(record.storage_path),
        storage_path=record.storage_path,
        created_at=record.created_at,
    )


def delete_upload(db: Session, *, user: User, file_id: uuid.UUID) -> None:
    record = db.get(UploadedFile, file_id)
    if record is None or record.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found.",
        )
    file_path = Path(record.storage_path)
    if not file_path.is_absolute():
        file_path = Path(settings.upload_path).parent / record.storage_path
    try:
        if file_path.exists():
            file_path.unlink()
    except OSError:
        pass
    db.delete(record)
    db.commit()
