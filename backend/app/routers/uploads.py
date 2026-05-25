from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.contact import Contact
from app.models.link import Link
from app.models.uploaded_file import UploadedFile
from app.schemas.upload import UploadResponse
from app.security.dependencies import get_current_user
from app.utils.files import delete_upload, save_upload

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=UploadResponse)
def upload_file(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UploadResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Only image uploads are allowed.")

    stored_filename, _, size_bytes = save_upload(file)
    upload = UploadedFile(
        user_id=current_user.id,
        original_filename=file.filename or stored_filename,
        stored_filename=stored_filename,
        content_type=file.content_type,
        size_bytes=size_bytes,
        public_url=f"/uploads/{stored_filename}",
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)
    return UploadResponse.model_validate(upload, from_attributes=True)


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(file_id: uuid.UUID, current_user=Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    upload = db.scalar(select(UploadedFile).where(UploadedFile.id == file_id, UploadedFile.user_id == current_user.id))
    if upload is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload file not found.")

    contacts = db.scalars(select(Contact).where(Contact.avatar_file_id == upload.id, Contact.user_id == current_user.id)).all()
    for contact in contacts:
        contact.avatar_file_id = None

    links = db.scalars(select(Link).where(Link.image_file_id == upload.id, Link.user_id == current_user.id)).all()
    for link in links:
        link.image_file_id = None

    delete_upload(upload.stored_filename)
    db.delete(upload)
    db.commit()
