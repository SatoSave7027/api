from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import Contact, Link, Upload, User
from app.schemas.vault import UploadOut
from app.security.dependencies import get_current_user

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("", response_model=UploadOut, status_code=status.HTTP_201_CREATED)
async def create_upload(file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> UploadOut:
    settings = get_settings()
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Only image uploads are allowed")
    data = await file.read()
    if len(data) > settings.upload_max_mb * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File is too large")
    extension = Path(file.filename or "image").suffix.lower()
    safe_extension = extension if extension in {".jpg", ".jpeg", ".png", ".gif", ".webp"} else ".bin"
    filename = f"{uuid4().hex}{safe_extension}"
    user_dir = settings.uploads_dir / user.id
    user_dir.mkdir(parents=True, exist_ok=True)
    storage_path = user_dir / filename
    storage_path.write_bytes(data)
    public_path = f"{settings.public_upload_base_url.rstrip('/')}/{user.id}/{filename}"
    upload = Upload(user_id=user.id, original_name=file.filename or filename, storage_path=str(storage_path), public_path=public_path, content_type=file.content_type, size=len(data))
    db.add(upload)
    db.commit()
    db.refresh(upload)
    return UploadOut(id=upload.id, url=upload.public_path, content_type=upload.content_type, size=upload.size, original_name=upload.original_name, created_at=upload.created_at)


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_upload(file_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Response:
    upload = db.get(Upload, file_id)
    if upload is None or upload.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found")
    db.query(Contact).filter(Contact.avatar_file_id == upload.id).update({Contact.avatar_file_id: None})
    db.query(Link).filter(Link.image_file_id == upload.id).update({Link.image_file_id: None})
    path = Path(upload.storage_path)
    if path.exists():
        path.unlink()
    db.delete(upload)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
