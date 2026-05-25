from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.config import get_settings

settings = get_settings()


def ensure_upload_dir() -> Path:
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def save_upload(file: UploadFile) -> tuple[str, str, int]:
    upload_dir = ensure_upload_dir()
    extension = Path(file.filename or "").suffix.lower()
    generated_name = f"{uuid.uuid4().hex}{extension}"
    destination = upload_dir / generated_name

    data = file.file.read()
    max_size = settings.max_upload_size_mb * 1024 * 1024
    if len(data) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File is too large. Max size is {settings.max_upload_size_mb} MB.",
        )

    with destination.open("wb") as output_file:
        output_file.write(data)

    return generated_name, str(destination), len(data)


def delete_upload(stored_filename: str) -> None:
    file_path = Path(settings.upload_dir) / stored_filename
    if file_path.exists():
        os.remove(file_path)
