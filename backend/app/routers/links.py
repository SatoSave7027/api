from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.link import LinkCreate, LinkUpdate, LinkResponse
from app.services.links import LinksService
from app.utils.deps import get_current_user

router = APIRouter(prefix="/links", tags=["links"])


@router.get("", response_model=List[LinkResponse])
async def list_links(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = LinksService(db)
    return await service.get_links(current_user.id)


@router.post("", response_model=LinkResponse, status_code=status.HTTP_201_CREATED)
async def create_link(
    body: LinkCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = LinksService(db)
    return await service.create_link(body, current_user.id)


@router.get("/{link_id}", response_model=LinkResponse)
async def get_link(
    link_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = LinksService(db)
    link = await service.get_link(link_id, current_user.id)
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")
    return link


@router.patch("/{link_id}", response_model=LinkResponse)
async def update_link(
    link_id: str,
    body: LinkUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = LinksService(db)
    link = await service.update_link(link_id, body, current_user.id)
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")
    return link


@router.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_link(
    link_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = LinksService(db)
    deleted = await service.delete_link(link_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")
