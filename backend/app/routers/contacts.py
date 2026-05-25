"""Contacts endpoints."""

from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.contact import ContactCreate, ContactOut, ContactUpdate
from app.security.deps import get_current_user
from app.services import contacts_service


router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.get("", response_model=List[ContactOut])
def list_contacts(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> List[ContactOut]:
    return contacts_service.list_contacts(db, user=user)


@router.post("", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def create_contact(
    payload: ContactCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ContactOut:
    return contacts_service.create_contact(db, user=user, payload=payload)


@router.get("/{contact_id}", response_model=ContactOut)
def get_contact(
    contact_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ContactOut:
    return contacts_service.get_contact(db, user=user, contact_id=contact_id)


@router.patch("/{contact_id}", response_model=ContactOut)
def update_contact(
    contact_id: uuid.UUID,
    payload: ContactUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ContactOut:
    return contacts_service.update_contact(
        db, user=user, contact_id=contact_id, payload=payload
    )


@router.delete(
    "/{contact_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_contact(
    contact_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    contacts_service.delete_contact(db, user=user, contact_id=contact_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
