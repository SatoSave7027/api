"""Uploads endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, File, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.upload import UploadOut
from app.security.deps import get_current_user
from app.services import upload_service


router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("", response_model=UploadOut, status_code=status.HTTP_201_CREATED)
def create_upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UploadOut:
    return upload_service.save_upload(db, user=user, file=file)


@router.delete(
    "/{file_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_upload(
    file_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    upload_service.delete_upload(db, user=user, file_id=file_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
