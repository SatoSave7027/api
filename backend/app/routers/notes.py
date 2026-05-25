from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse
from app.services.notes import NotesService
from app.utils.deps import get_current_user

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=List[NoteResponse])
async def list_notes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotesService(db)
    return await service.get_notes(current_user.id)


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    body: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotesService(db)
    return await service.create_note(body, current_user.id)


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotesService(db)
    note = await service.get_note(note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


@router.patch("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    body: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotesService(db)
    note = await service.update_note(note_id, body, current_user.id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotesService(db)
    deleted = await service.delete_note(note_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
