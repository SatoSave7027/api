from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.link import Link
from app.models.uploaded_file import UploadedFile
from app.schemas.link import LinkCreate, LinkResponse, LinkUpdate
from app.security.crypto import decrypt_text, encrypt_text
from app.security.dependencies import get_current_user

router = APIRouter(prefix="/links", tags=["links"])


def _serialize(link: Link) -> LinkResponse:
    return LinkResponse(
        id=link.id,
        title=decrypt_text(link.title_encrypted) or "",
        url=decrypt_text(link.url_encrypted) or "",
        description=decrypt_text(link.description_encrypted),
        image_file_id=link.image_file_id,
        image_url=link.image_file.public_url if link.image_file else None,
        created_at=link.created_at,
        updated_at=link.updated_at,
    )


def _require_owned_upload(db: Session, user_id: uuid.UUID, file_id: uuid.UUID | None) -> UploadedFile | None:
    if file_id is None:
        return None
    upload = db.scalar(select(UploadedFile).where(UploadedFile.id == file_id, UploadedFile.user_id == user_id))
    if upload is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload file not found.")
    return upload


@router.get("", response_model=list[LinkResponse])
def list_links(current_user=Depends(get_current_user), db: Session = Depends(get_db)) -> list[LinkResponse]:
    links = db.scalars(select(Link).where(Link.user_id == current_user.id).order_by(Link.updated_at.desc())).all()
    return [_serialize(link) for link in links]


@router.post("", status_code=status.HTTP_201_CREATED, response_model=LinkResponse)
def create_link(payload: LinkCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)) -> LinkResponse:
    _require_owned_upload(db, current_user.id, payload.image_file_id)

    link = Link(
        user_id=current_user.id,
        title_encrypted=encrypt_text(payload.title) or "",
        url_encrypted=encrypt_text(str(payload.url)) or "",
        description_encrypted=encrypt_text(payload.description),
        image_file_id=payload.image_file_id,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return _serialize(link)


@router.get("/{link_id}", response_model=LinkResponse)
def get_link(link_id: uuid.UUID, current_user=Depends(get_current_user), db: Session = Depends(get_db)) -> LinkResponse:
    link = db.scalar(select(Link).where(Link.id == link_id, Link.user_id == current_user.id))
    if link is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found.")
    return _serialize(link)


@router.patch("/{link_id}", response_model=LinkResponse)
def update_link(
    link_id: uuid.UUID,
    payload: LinkUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LinkResponse:
    link = db.scalar(select(Link).where(Link.id == link_id, Link.user_id == current_user.id))
    if link is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found.")

    changes = payload.model_dump(exclude_unset=True)
    if "image_file_id" in changes:
        _require_owned_upload(db, current_user.id, changes["image_file_id"])
        link.image_file_id = changes["image_file_id"]
    if "title" in changes:
        link.title_encrypted = encrypt_text(changes["title"]) or ""
    if "url" in changes:
        link.url_encrypted = encrypt_text(str(changes["url"])) or ""
    if "description" in changes:
        link.description_encrypted = encrypt_text(changes["description"])

    db.commit()
    db.refresh(link)
    return _serialize(link)


@router.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_link(link_id: uuid.UUID, current_user=Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    link = db.scalar(select(Link).where(Link.id == link_id, Link.user_id == current_user.id))
    if link is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found.")
    db.delete(link)
    db.commit()
