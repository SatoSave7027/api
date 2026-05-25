from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.link import Link
from app.models.upload import Upload
from app.schemas.link import LinkCreate, LinkUpdate, LinkResponse, ImageInfo
from app.security.encryption import encrypt_text, decrypt_text


def _decrypt_link(link: Link) -> LinkResponse:
    image_info = None
    if link.image:
        image_info = ImageInfo(id=link.image.id, url=link.image.url)

    return LinkResponse(
        id=link.id,
        user_id=link.user_id,
        title=decrypt_text(link.title),
        url=decrypt_text(link.url),
        description=decrypt_text(link.description),
        image_id=link.image_id,
        image=image_info,
        created_at=link.created_at,
        updated_at=link.updated_at,
    )


class LinksService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_links(self, user_id: str) -> List[LinkResponse]:
        result = await self.db.execute(
            select(Link)
            .options(selectinload(Link.image))
            .where(Link.user_id == user_id)
            .order_by(Link.updated_at.desc())
        )
        links = result.scalars().all()
        return [_decrypt_link(lnk) for lnk in links]

    async def get_link(self, link_id: str, user_id: str) -> Optional[LinkResponse]:
        result = await self.db.execute(
            select(Link)
            .options(selectinload(Link.image))
            .where(Link.id == link_id, Link.user_id == user_id)
        )
        link = result.scalar_one_or_none()
        if not link:
            return None
        return _decrypt_link(link)

    async def create_link(self, data: LinkCreate, user_id: str) -> LinkResponse:
        if data.image_id:
            upload_result = await self.db.execute(
                select(Upload).where(Upload.id == data.image_id, Upload.user_id == user_id)
            )
            if not upload_result.scalar_one_or_none():
                data = data.model_copy(update={"image_id": None})

        link = Link(
            user_id=user_id,
            title=encrypt_text(data.title),
            url=encrypt_text(data.url),
            description=encrypt_text(data.description),
            image_id=data.image_id,
        )
        self.db.add(link)
        await self.db.flush()

        result = await self.db.execute(
            select(Link)
            .options(selectinload(Link.image))
            .where(Link.id == link.id)
        )
        link = result.scalar_one()
        return _decrypt_link(link)

    async def update_link(
        self, link_id: str, data: LinkUpdate, user_id: str
    ) -> Optional[LinkResponse]:
        result = await self.db.execute(
            select(Link)
            .options(selectinload(Link.image))
            .where(Link.id == link_id, Link.user_id == user_id)
        )
        link = result.scalar_one_or_none()
        if not link:
            return None

        if data.title is not None:
            link.title = encrypt_text(data.title)
        if data.url is not None:
            link.url = encrypt_text(data.url)
        if data.description is not None:
            link.description = encrypt_text(data.description)
        if data.image_id is not None:
            upload_result = await self.db.execute(
                select(Upload).where(
                    Upload.id == data.image_id, Upload.user_id == user_id
                )
            )
            if upload_result.scalar_one_or_none():
                link.image_id = data.image_id

        await self.db.flush()

        result = await self.db.execute(
            select(Link)
            .options(selectinload(Link.image))
            .where(Link.id == link.id)
        )
        link = result.scalar_one()
        return _decrypt_link(link)

    async def delete_link(self, link_id: str, user_id: str) -> bool:
        result = await self.db.execute(
            select(Link).where(Link.id == link_id, Link.user_id == user_id)
        )
        link = result.scalar_one_or_none()
        if not link:
            return False
        await self.db.delete(link)
        await self.db.flush()
        return True
