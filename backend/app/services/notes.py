from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse
from app.security.encryption import encrypt_text, decrypt_text


def _decrypt_note(note: Note) -> NoteResponse:
    return NoteResponse(
        id=note.id,
        user_id=note.user_id,
        title=decrypt_text(note.title),
        content=decrypt_text(note.content),
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


class NotesService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_notes(self, user_id: str) -> List[NoteResponse]:
        result = await self.db.execute(
            select(Note)
            .where(Note.user_id == user_id)
            .order_by(Note.updated_at.desc())
        )
        notes = result.scalars().all()
        return [_decrypt_note(n) for n in notes]

    async def get_note(self, note_id: str, user_id: str) -> Optional[NoteResponse]:
        result = await self.db.execute(
            select(Note).where(Note.id == note_id, Note.user_id == user_id)
        )
        note = result.scalar_one_or_none()
        if not note:
            return None
        return _decrypt_note(note)

    async def create_note(self, data: NoteCreate, user_id: str) -> NoteResponse:
        note = Note(
            user_id=user_id,
            title=encrypt_text(data.title),
            content=encrypt_text(data.content),
        )
        self.db.add(note)
        await self.db.flush()
        await self.db.refresh(note)
        return _decrypt_note(note)

    async def update_note(
        self, note_id: str, data: NoteUpdate, user_id: str
    ) -> Optional[NoteResponse]:
        result = await self.db.execute(
            select(Note).where(Note.id == note_id, Note.user_id == user_id)
        )
        note = result.scalar_one_or_none()
        if not note:
            return None
        if data.title is not None:
            note.title = encrypt_text(data.title)
        if data.content is not None:
            note.content = encrypt_text(data.content)
        await self.db.flush()
        await self.db.refresh(note)
        return _decrypt_note(note)

    async def delete_note(self, note_id: str, user_id: str) -> bool:
        result = await self.db.execute(
            select(Note).where(Note.id == note_id, Note.user_id == user_id)
        )
        note = result.scalar_one_or_none()
        if not note:
            return False
        await self.db.delete(note)
        await self.db.flush()
        return True
