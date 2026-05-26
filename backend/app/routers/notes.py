from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Note, User
from app.schemas.vault import NoteCreate, NoteOut, NoteUpdate
from app.security.dependencies import get_current_user
from app.services.vault import encrypted, get_owned_note, list_notes, note_to_out

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=list[NoteOut])
def index(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> list[NoteOut]:
    return list_notes(db, user)


@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def create(payload: NoteCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> NoteOut:
    note = Note(user_id=user.id, encrypted_title=encrypted(payload.title), encrypted_content=encrypted(payload.content))
    db.add(note)
    db.commit()
    db.refresh(note)
    return note_to_out(note)


@router.get("/{note_id}", response_model=NoteOut)
def show(note_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> NoteOut:
    return note_to_out(get_owned_note(db, note_id, user))


@router.patch("/{note_id}", response_model=NoteOut)
def update(note_id: str, payload: NoteUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> NoteOut:
    note = get_owned_note(db, note_id, user)
    if payload.title is not None:
        note.encrypted_title = encrypted(payload.title)
    if payload.content is not None:
        note.encrypted_content = encrypted(payload.content)
    db.commit()
    db.refresh(note)
    return note_to_out(note)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def destroy(note_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Response:
    note = get_owned_note(db, note_id, user)
    db.delete(note)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
