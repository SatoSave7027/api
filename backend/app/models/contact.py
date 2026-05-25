from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, utcnow


class Contact(Base):
    __tablename__ = "contacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    encrypted_name: Mapped[str] = mapped_column(Text, nullable=False)
    encrypted_phone: Mapped[str | None] = mapped_column(Text, nullable=True)
    encrypted_telegram_username: Mapped[str | None] = mapped_column(Text, nullable=True)
    encrypted_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_file_id: Mapped[str | None] = mapped_column(ForeignKey("uploads.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="contacts")
    avatar = relationship("Upload", foreign_keys=[avatar_file_id])
