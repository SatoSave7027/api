from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.contact import ContactCreate, ContactUpdate, ContactResponse
from app.services.contacts import ContactsService
from app.utils.deps import get_current_user

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.get("", response_model=List[ContactResponse])
async def list_contacts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ContactsService(db)
    return await service.get_contacts(current_user.id)


@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(
    body: ContactCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ContactsService(db)
    return await service.create_contact(body, current_user.id)


@router.get("/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ContactsService(db)
    contact = await service.get_contact(contact_id, current_user.id)
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    return contact


@router.patch("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: str,
    body: ContactUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ContactsService(db)
    contact = await service.update_contact(contact_id, body, current_user.id)
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ContactsService(db)
    deleted = await service.delete_contact(contact_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
