"""Service layer for notes (encrypt before save, decrypt on read)."""

from __future__ import annotations

import uuid
from typing import List

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.note import Note
from app.models.user import User
from app.schemas.note import NoteCreate, NoteOut, NoteUpdate
from app.security.encryption import decrypt_text, encrypt_text


def _to_out(note: Note) -> NoteOut:
    return NoteOut(
        id=note.id,
        title=decrypt_text(note.title_encrypted) or "",
        content=decrypt_text(note.content_encrypted) or "",
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


def list_notes(db: Session, *, user: User) -> List[NoteOut]:
    rows = db.execute(
        select(Note).where(Note.user_id == user.id).order_by(Note.updated_at.desc())
    ).scalars().all()
    return [_to_out(row) for row in rows]


def _get_owned(db: Session, *, user: User, note_id: uuid.UUID) -> Note:
    note = db.get(Note, note_id)
    if note is None or note.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found.",
        )
    return note


def get_note(db: Session, *, user: User, note_id: uuid.UUID) -> NoteOut:
    return _to_out(_get_owned(db, user=user, note_id=note_id))


def create_note(db: Session, *, user: User, payload: NoteCreate) -> NoteOut:
    note = Note(
        user_id=user.id,
        title_encrypted=encrypt_text(payload.title) or "",
        content_encrypted=encrypt_text(payload.content) or "",
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return _to_out(note)


def update_note(
    db: Session, *, user: User, note_id: uuid.UUID, payload: NoteUpdate
) -> NoteOut:
    note = _get_owned(db, user=user, note_id=note_id)
    if payload.title is not None:
        note.title_encrypted = encrypt_text(payload.title) or ""
    if payload.content is not None:
        note.content_encrypted = encrypt_text(payload.content) or ""
    db.add(note)
    db.commit()
    db.refresh(note)
    return _to_out(note)


def delete_note(db: Session, *, user: User, note_id: uuid.UUID) -> None:
    note = _get_owned(db, user=user, note_id=note_id)
    db.delete(note)
    db.commit()
