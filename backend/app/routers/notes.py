"""Notes endpoints."""

from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.note import NoteCreate, NoteOut, NoteUpdate
from app.security.deps import get_current_user
from app.services import notes_service


router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=List[NoteOut])
def list_notes(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> List[NoteOut]:
    return notes_service.list_notes(db, user=user)


@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def create_note(
    payload: NoteCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> NoteOut:
    return notes_service.create_note(db, user=user, payload=payload)


@router.get("/{note_id}", response_model=NoteOut)
def get_note(
    note_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> NoteOut:
    return notes_service.get_note(db, user=user, note_id=note_id)


@router.patch("/{note_id}", response_model=NoteOut)
def update_note(
    note_id: uuid.UUID,
    payload: NoteUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> NoteOut:
    return notes_service.update_note(db, user=user, note_id=note_id, payload=payload)


@router.delete(
    "/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_note(
    note_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    notes_service.delete_note(db, user=user, note_id=note_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
