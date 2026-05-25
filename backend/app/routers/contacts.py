from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Contact, User
from app.schemas.vault import ContactCreate, ContactOut, ContactUpdate
from app.security.dependencies import get_current_user
from app.services.vault import contact_to_out, encrypted, ensure_upload_owner, get_owned_contact, list_contacts, validate_contact_channels

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.get("", response_model=list[ContactOut])
def index(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> list[ContactOut]:
    return list_contacts(db, user)


@router.post("", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def create(payload: ContactCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ContactOut:
    ensure_upload_owner(db, payload.avatar_file_id, user.id)
    contact = Contact(
        user_id=user.id,
        encrypted_name=encrypted(payload.name),
        encrypted_phone=encrypted(payload.phone),
        encrypted_telegram_username=encrypted(payload.telegram_username),
        encrypted_description=encrypted(payload.description),
        avatar_file_id=payload.avatar_file_id,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact_to_out(contact)


@router.get("/{contact_id}", response_model=ContactOut)
def show(contact_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ContactOut:
    return contact_to_out(get_owned_contact(db, contact_id, user))


@router.patch("/{contact_id}", response_model=ContactOut)
def update(contact_id: str, payload: ContactUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> ContactOut:
    contact = get_owned_contact(db, contact_id, user)
    if payload.avatar_file_id is not None:
        ensure_upload_owner(db, payload.avatar_file_id, user.id)
        contact.avatar_file_id = payload.avatar_file_id
    if payload.name is not None:
        contact.encrypted_name = encrypted(payload.name)
    if payload.phone is not None:
        contact.encrypted_phone = encrypted(payload.phone)
    if payload.telegram_username is not None:
        contact.encrypted_telegram_username = encrypted(payload.telegram_username)
    if payload.description is not None:
        contact.encrypted_description = encrypted(payload.description)
    current = contact_to_out(contact)
    validate_contact_channels(current.phone, current.telegram_username)
    db.commit()
    db.refresh(contact)
    return contact_to_out(contact)


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def destroy(contact_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Response:
    contact = get_owned_contact(db, contact_id, user)
    db.delete(contact)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
