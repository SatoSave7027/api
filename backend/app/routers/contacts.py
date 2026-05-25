from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.contact import Contact
from app.models.uploaded_file import UploadedFile
from app.schemas.contact import ContactCreate, ContactResponse, ContactUpdate
from app.security.crypto import decrypt_text, encrypt_text
from app.security.dependencies import get_current_user

router = APIRouter(prefix="/contacts", tags=["contacts"])


def _serialize(contact: Contact) -> ContactResponse:
    return ContactResponse(
        id=contact.id,
        name=contact.name,
        phone=decrypt_text(contact.phone_encrypted),
        telegram_username=decrypt_text(contact.telegram_username_encrypted),
        description=decrypt_text(contact.description_encrypted),
        avatar_file_id=contact.avatar_file_id,
        avatar_url=contact.avatar_file.public_url if contact.avatar_file else None,
        created_at=contact.created_at,
        updated_at=contact.updated_at,
    )


def _require_owned_upload(db: Session, user_id: uuid.UUID, file_id: uuid.UUID | None) -> UploadedFile | None:
    if file_id is None:
        return None
    upload = db.scalar(select(UploadedFile).where(UploadedFile.id == file_id, UploadedFile.user_id == user_id))
    if upload is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload file not found.")
    return upload


@router.get("", response_model=list[ContactResponse])
def list_contacts(current_user=Depends(get_current_user), db: Session = Depends(get_db)) -> list[ContactResponse]:
    contacts = db.scalars(select(Contact).where(Contact.user_id == current_user.id).order_by(Contact.updated_at.desc())).all()
    return [_serialize(contact) for contact in contacts]


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ContactResponse)
def create_contact(
    payload: ContactCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ContactResponse:
    _require_owned_upload(db, current_user.id, payload.avatar_file_id)

    contact = Contact(
        user_id=current_user.id,
        name=payload.name,
        phone_encrypted=encrypt_text(payload.phone),
        telegram_username_encrypted=encrypt_text(payload.telegram_username),
        description_encrypted=encrypt_text(payload.description),
        avatar_file_id=payload.avatar_file_id,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return _serialize(contact)


@router.get("/{contact_id}", response_model=ContactResponse)
def get_contact(contact_id: uuid.UUID, current_user=Depends(get_current_user), db: Session = Depends(get_db)) -> ContactResponse:
    contact = db.scalar(select(Contact).where(Contact.id == contact_id, Contact.user_id == current_user.id))
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found.")
    return _serialize(contact)


@router.patch("/{contact_id}", response_model=ContactResponse)
def update_contact(
    contact_id: uuid.UUID,
    payload: ContactUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ContactResponse:
    contact = db.scalar(select(Contact).where(Contact.id == contact_id, Contact.user_id == current_user.id))
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found.")

    changes = payload.model_dump(exclude_unset=True)
    if "avatar_file_id" in changes:
        _require_owned_upload(db, current_user.id, changes["avatar_file_id"])
        contact.avatar_file_id = changes["avatar_file_id"]

    current_phone = decrypt_text(contact.phone_encrypted)
    current_telegram = decrypt_text(contact.telegram_username_encrypted)
    if "phone" in changes:
        current_phone = changes["phone"]
    if "telegram_username" in changes:
        current_telegram = changes["telegram_username"]
    if not current_phone and not current_telegram:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Either phone or telegram_username must be provided.",
        )

    if "name" in changes:
        contact.name = changes["name"]
    if "phone" in changes:
        contact.phone_encrypted = encrypt_text(changes["phone"])
    if "telegram_username" in changes:
        contact.telegram_username_encrypted = encrypt_text(changes["telegram_username"])
    if "description" in changes:
        contact.description_encrypted = encrypt_text(changes["description"])

    db.commit()
    db.refresh(contact)
    return _serialize(contact)


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(contact_id: uuid.UUID, current_user=Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    contact = db.scalar(select(Contact).where(Contact.id == contact_id, Contact.user_id == current_user.id))
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found.")
    db.delete(contact)
    db.commit()
