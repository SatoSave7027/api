"""Service layer for contacts."""

from __future__ import annotations

import uuid
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.contact import Contact
from app.models.user import User
from app.schemas.contact import ContactCreate, ContactOut, ContactUpdate
from app.security.encryption import decrypt_text, encrypt_text


def _avatar_url(path: Optional[str]) -> Optional[str]:
    if not path:
        return None
    base = settings.public_base_url.rstrip("/")
    rel = path.lstrip("/")
    return f"{base}/{rel}"


def _to_out(contact: Contact) -> ContactOut:
    return ContactOut(
        id=contact.id,
        name=decrypt_text(contact.name_encrypted) or "",
        phone=decrypt_text(contact.phone_encrypted),
        telegram_username=decrypt_text(contact.telegram_username_encrypted),
        description=decrypt_text(contact.description_encrypted),
        avatar_url=_avatar_url(contact.avatar_path),
        created_at=contact.created_at,
        updated_at=contact.updated_at,
    )


def list_contacts(db: Session, *, user: User) -> List[ContactOut]:
    rows = db.execute(
        select(Contact)
        .where(Contact.user_id == user.id)
        .order_by(Contact.updated_at.desc())
    ).scalars().all()
    return [_to_out(row) for row in rows]


def _get_owned(db: Session, *, user: User, contact_id: uuid.UUID) -> Contact:
    contact = db.get(Contact, contact_id)
    if contact is None or contact.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found.",
        )
    return contact


def get_contact(db: Session, *, user: User, contact_id: uuid.UUID) -> ContactOut:
    return _to_out(_get_owned(db, user=user, contact_id=contact_id))


def create_contact(
    db: Session, *, user: User, payload: ContactCreate
) -> ContactOut:
    contact = Contact(
        user_id=user.id,
        name_encrypted=encrypt_text(payload.name) or "",
        phone_encrypted=encrypt_text(payload.phone) if payload.phone else None,
        telegram_username_encrypted=(
            encrypt_text(payload.telegram_username)
            if payload.telegram_username
            else None
        ),
        description_encrypted=(
            encrypt_text(payload.description) if payload.description else None
        ),
        avatar_path=payload.avatar_path,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return _to_out(contact)


def update_contact(
    db: Session, *, user: User, contact_id: uuid.UUID, payload: ContactUpdate
) -> ContactOut:
    contact = _get_owned(db, user=user, contact_id=contact_id)
    if payload.name is not None:
        contact.name_encrypted = encrypt_text(payload.name) or ""
    if payload.phone is not None:
        contact.phone_encrypted = (
            encrypt_text(payload.phone) if payload.phone else None
        )
    if payload.telegram_username is not None:
        contact.telegram_username_encrypted = (
            encrypt_text(payload.telegram_username)
            if payload.telegram_username
            else None
        )
    if payload.description is not None:
        contact.description_encrypted = (
            encrypt_text(payload.description) if payload.description else None
        )
    if payload.avatar_path is not None:
        contact.avatar_path = payload.avatar_path or None

    has_phone = bool(decrypt_text(contact.phone_encrypted))
    has_telegram = bool(decrypt_text(contact.telegram_username_encrypted))
    if not has_phone and not has_telegram:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'phone' or 'telegram_username' must be provided.",
        )

    db.add(contact)
    db.commit()
    db.refresh(contact)
    return _to_out(contact)


def delete_contact(db: Session, *, user: User, contact_id: uuid.UUID) -> None:
    contact = _get_owned(db, user=user, contact_id=contact_id)
    db.delete(contact)
    db.commit()
