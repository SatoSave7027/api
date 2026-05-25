"""User ORM model."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.note import Note
    from app.models.contact import Contact
    from app.models.link import Link
    from app.models.session import AuthSession
    from app.models.upload import UploadedFile


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    notes: Mapped[List["Note"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    contacts: Mapped[List["Contact"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    links: Mapped[List["Link"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    sessions: Mapped[List["AuthSession"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    uploads: Mapped[List["UploadedFile"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
