from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.contact import Contact
from app.models.upload import Upload
from app.schemas.contact import ContactCreate, ContactUpdate, ContactResponse, AvatarInfo
from app.security.encryption import encrypt_text, decrypt_text


def _decrypt_contact(contact: Contact) -> ContactResponse:
    avatar_info = None
    if contact.avatar:
        avatar_info = AvatarInfo(id=contact.avatar.id, url=contact.avatar.url)

    return ContactResponse(
        id=contact.id,
        user_id=contact.user_id,
        name=decrypt_text(contact.name),
        phone=decrypt_text(contact.phone),
        telegram_username=decrypt_text(contact.telegram_username),
        description=decrypt_text(contact.description),
        avatar_id=contact.avatar_id,
        avatar=avatar_info,
        created_at=contact.created_at,
        updated_at=contact.updated_at,
    )


class ContactsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_contacts(self, user_id: str) -> List[ContactResponse]:
        result = await self.db.execute(
            select(Contact)
            .options(selectinload(Contact.avatar))
            .where(Contact.user_id == user_id)
            .order_by(Contact.updated_at.desc())
        )
        contacts = result.scalars().all()
        return [_decrypt_contact(c) for c in contacts]

    async def get_contact(self, contact_id: str, user_id: str) -> Optional[ContactResponse]:
        result = await self.db.execute(
            select(Contact)
            .options(selectinload(Contact.avatar))
            .where(Contact.id == contact_id, Contact.user_id == user_id)
        )
        contact = result.scalar_one_or_none()
        if not contact:
            return None
        return _decrypt_contact(contact)

    async def create_contact(self, data: ContactCreate, user_id: str) -> ContactResponse:
        if data.avatar_id:
            upload_result = await self.db.execute(
                select(Upload).where(Upload.id == data.avatar_id, Upload.user_id == user_id)
            )
            if not upload_result.scalar_one_or_none():
                data = data.model_copy(update={"avatar_id": None})

        contact = Contact(
            user_id=user_id,
            name=encrypt_text(data.name),
            phone=encrypt_text(data.phone),
            telegram_username=encrypt_text(data.telegram_username),
            description=encrypt_text(data.description),
            avatar_id=data.avatar_id,
        )
        self.db.add(contact)
        await self.db.flush()

        result = await self.db.execute(
            select(Contact)
            .options(selectinload(Contact.avatar))
            .where(Contact.id == contact.id)
        )
        contact = result.scalar_one()
        return _decrypt_contact(contact)

    async def update_contact(
        self, contact_id: str, data: ContactUpdate, user_id: str
    ) -> Optional[ContactResponse]:
        result = await self.db.execute(
            select(Contact)
            .options(selectinload(Contact.avatar))
            .where(Contact.id == contact_id, Contact.user_id == user_id)
        )
        contact = result.scalar_one_or_none()
        if not contact:
            return None

        if data.name is not None:
            contact.name = encrypt_text(data.name)
        if data.phone is not None:
            contact.phone = encrypt_text(data.phone)
        if data.telegram_username is not None:
            contact.telegram_username = encrypt_text(data.telegram_username)
        if data.description is not None:
            contact.description = encrypt_text(data.description)
        if data.avatar_id is not None:
            upload_result = await self.db.execute(
                select(Upload).where(
                    Upload.id == data.avatar_id, Upload.user_id == user_id
                )
            )
            if upload_result.scalar_one_or_none():
                contact.avatar_id = data.avatar_id

        await self.db.flush()

        result = await self.db.execute(
            select(Contact)
            .options(selectinload(Contact.avatar))
            .where(Contact.id == contact.id)
        )
        contact = result.scalar_one()
        return _decrypt_contact(contact)

    async def delete_contact(self, contact_id: str, user_id: str) -> bool:
        result = await self.db.execute(
            select(Contact).where(Contact.id == contact_id, Contact.user_id == user_id)
        )
        contact = result.scalar_one_or_none()
        if not contact:
            return False
        await self.db.delete(contact)
        await self.db.flush()
        return True
