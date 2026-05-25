"""Service layer for links."""

from __future__ import annotations

import uuid
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.link import Link
from app.models.user import User
from app.schemas.link import LinkCreate, LinkOut, LinkUpdate
from app.security.encryption import decrypt_text, encrypt_text


def _image_url(path: Optional[str]) -> Optional[str]:
    if not path:
        return None
    base = settings.public_base_url.rstrip("/")
    rel = path.lstrip("/")
    return f"{base}/{rel}"


def _to_out(link: Link) -> LinkOut:
    return LinkOut(
        id=link.id,
        title=decrypt_text(link.title_encrypted) or "",
        url=decrypt_text(link.url_encrypted) or "",
        description=decrypt_text(link.description_encrypted),
        image_url=_image_url(link.image_path),
        created_at=link.created_at,
        updated_at=link.updated_at,
    )


def list_links(db: Session, *, user: User) -> List[LinkOut]:
    rows = db.execute(
        select(Link).where(Link.user_id == user.id).order_by(Link.updated_at.desc())
    ).scalars().all()
    return [_to_out(row) for row in rows]


def _get_owned(db: Session, *, user: User, link_id: uuid.UUID) -> Link:
    link = db.get(Link, link_id)
    if link is None or link.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link not found.",
        )
    return link


def get_link(db: Session, *, user: User, link_id: uuid.UUID) -> LinkOut:
    return _to_out(_get_owned(db, user=user, link_id=link_id))


def create_link(db: Session, *, user: User, payload: LinkCreate) -> LinkOut:
    link = Link(
        user_id=user.id,
        title_encrypted=encrypt_text(payload.title) or "",
        url_encrypted=encrypt_text(payload.url) or "",
        description_encrypted=(
            encrypt_text(payload.description) if payload.description else None
        ),
        image_path=payload.image_path,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return _to_out(link)


def update_link(
    db: Session, *, user: User, link_id: uuid.UUID, payload: LinkUpdate
) -> LinkOut:
    link = _get_owned(db, user=user, link_id=link_id)
    if payload.title is not None:
        link.title_encrypted = encrypt_text(payload.title) or ""
    if payload.url is not None:
        link.url_encrypted = encrypt_text(payload.url) or ""
    if payload.description is not None:
        link.description_encrypted = (
            encrypt_text(payload.description) if payload.description else None
        )
    if payload.image_path is not None:
        link.image_path = payload.image_path or None
    db.add(link)
    db.commit()
    db.refresh(link)
    return _to_out(link)


def delete_link(db: Session, *, user: User, link_id: uuid.UUID) -> None:
    link = _get_owned(db, user=user, link_id=link_id)
    db.delete(link)
    db.commit()
