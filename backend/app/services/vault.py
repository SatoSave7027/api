from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Contact, Link, Note, Upload, User
from app.schemas.vault import ContactOut, LinkOut, NoteOut
from app.security.crypto import decrypt_value, encrypt_value


def ensure_upload_owner(db: Session, upload_id: str | None, user_id: str) -> None:
    if upload_id is None:
        return
    upload = db.get(Upload, upload_id)
    if upload is None or upload.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Upload does not exist")


def note_to_out(note: Note) -> NoteOut:
    return NoteOut(id=note.id, title=decrypt_value(note.encrypted_title) or "", content=decrypt_value(note.encrypted_content) or "", created_at=note.created_at, updated_at=note.updated_at)


def contact_to_out(contact: Contact) -> ContactOut:
    return ContactOut(
        id=contact.id,
        name=decrypt_value(contact.encrypted_name) or "",
        phone=decrypt_value(contact.encrypted_phone),
        telegram_username=decrypt_value(contact.encrypted_telegram_username),
        description=decrypt_value(contact.encrypted_description),
        avatar_file_id=contact.avatar_file_id,
        avatar_url=contact.avatar.public_path if contact.avatar else None,
        created_at=contact.created_at,
        updated_at=contact.updated_at,
    )


def link_to_out(link: Link) -> LinkOut:
    return LinkOut(
        id=link.id,
        title=decrypt_value(link.encrypted_title) or "",
        url=decrypt_value(link.encrypted_url) or "",
        description=decrypt_value(link.encrypted_description),
        image_file_id=link.image_file_id,
        image_url=link.image.public_path if link.image else None,
        created_at=link.created_at,
        updated_at=link.updated_at,
    )


def get_owned_note(db: Session, note_id: str, user: User) -> Note:
    note = db.get(Note, note_id)
    if note is None or note.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


def get_owned_contact(db: Session, contact_id: str, user: User) -> Contact:
    contact = db.get(Contact, contact_id)
    if contact is None or contact.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    return contact


def get_owned_link(db: Session, link_id: str, user: User) -> Link:
    link = db.get(Link, link_id)
    if link is None or link.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")
    return link


def list_notes(db: Session, user: User) -> list[NoteOut]:
    rows = db.execute(select(Note).where(Note.user_id == user.id).order_by(Note.updated_at.desc())).scalars().all()
    return [note_to_out(row) for row in rows]


def list_contacts(db: Session, user: User) -> list[ContactOut]:
    rows = db.execute(select(Contact).where(Contact.user_id == user.id).order_by(Contact.updated_at.desc())).scalars().all()
    return [contact_to_out(row) for row in rows]


def list_links(db: Session, user: User) -> list[LinkOut]:
    rows = db.execute(select(Link).where(Link.user_id == user.id).order_by(Link.updated_at.desc())).scalars().all()
    return [link_to_out(row) for row in rows]


def validate_contact_channels(phone: str | None, telegram_username: str | None) -> None:
    if not phone and not telegram_username:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="phone or telegram_username is required")


def encrypted(value: str | None) -> str | None:
    return encrypt_value(value.strip() if isinstance(value, str) else value)
