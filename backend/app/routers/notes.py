from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteResponse, NoteUpdate
from app.security.crypto import decrypt_text, encrypt_text
from app.security.dependencies import get_current_user

router = APIRouter(prefix="/notes", tags=["notes"])


def _serialize(note: Note) -> NoteResponse:
    return NoteResponse(
        id=note.id,
        title=decrypt_text(note.title_encrypted) or "",
        content=decrypt_text(note.content_encrypted) or "",
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


@router.get("", response_model=list[NoteResponse])
def list_notes(current_user=Depends(get_current_user), db: Session = Depends(get_db)) -> list[NoteResponse]:
    notes = db.scalars(select(Note).where(Note.user_id == current_user.id).order_by(Note.updated_at.desc())).all()
    return [_serialize(note) for note in notes]


@router.post("", status_code=status.HTTP_201_CREATED, response_model=NoteResponse)
def create_note(payload: NoteCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)) -> NoteResponse:
    note = Note(
        user_id=current_user.id,
        title_encrypted=encrypt_text(payload.title) or "",
        content_encrypted=encrypt_text(payload.content) or "",
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return _serialize(note)


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: uuid.UUID, current_user=Depends(get_current_user), db: Session = Depends(get_db)) -> NoteResponse:
    note = db.scalar(select(Note).where(Note.id == note_id, Note.user_id == current_user.id))
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")
    return _serialize(note)


@router.patch("/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: uuid.UUID,
    payload: NoteUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NoteResponse:
    note = db.scalar(select(Note).where(Note.id == note_id, Note.user_id == current_user.id))
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")

    changes = payload.model_dump(exclude_unset=True)
    if "title" in changes:
        note.title_encrypted = encrypt_text(changes["title"]) or ""
    if "content" in changes:
        note.content_encrypted = encrypt_text(changes["content"]) or ""

    db.commit()
    db.refresh(note)
    return _serialize(note)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: uuid.UUID, current_user=Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    note = db.scalar(select(Note).where(Note.id == note_id, Note.user_id == current_user.id))
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")
    db.delete(note)
    db.commit()
