"""Links endpoints."""

from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.link import LinkCreate, LinkOut, LinkUpdate
from app.security.deps import get_current_user
from app.services import links_service


router = APIRouter(prefix="/links", tags=["links"])


@router.get("", response_model=List[LinkOut])
def list_links(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> List[LinkOut]:
    return links_service.list_links(db, user=user)


@router.post("", response_model=LinkOut, status_code=status.HTTP_201_CREATED)
def create_link(
    payload: LinkCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> LinkOut:
    return links_service.create_link(db, user=user, payload=payload)


@router.get("/{link_id}", response_model=LinkOut)
def get_link(
    link_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> LinkOut:
    return links_service.get_link(db, user=user, link_id=link_id)


@router.patch("/{link_id}", response_model=LinkOut)
def update_link(
    link_id: uuid.UUID,
    payload: LinkUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> LinkOut:
    return links_service.update_link(db, user=user, link_id=link_id, payload=payload)


@router.delete(
    "/{link_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_link(
    link_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    links_service.delete_link(db, user=user, link_id=link_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
