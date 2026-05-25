"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-25
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("users", sa.Column("id", sa.String(length=36), primary_key=True), sa.Column("email", sa.String(length=320), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_table("otp_challenges", sa.Column("id", sa.String(length=36), primary_key=True), sa.Column("email", sa.String(length=320), nullable=False), sa.Column("code_hash", sa.String(length=128), nullable=False), sa.Column("attempts", sa.Integer(), nullable=False), sa.Column("max_attempts", sa.Integer(), nullable=False), sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False), sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_otp_challenges_email", "otp_challenges", ["email"])
    op.create_table("user_sessions", sa.Column("id", sa.String(length=36), primary_key=True), sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("refresh_token_hash", sa.String(length=128), nullable=False), sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False), sa.Column("last_activity_at", sa.DateTime(timezone=True), nullable=False), sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_user_sessions_user_id", "user_sessions", ["user_id"])
    op.create_index("ix_user_sessions_refresh_token_hash", "user_sessions", ["refresh_token_hash"], unique=True)
    op.create_table("uploads", sa.Column("id", sa.String(length=36), primary_key=True), sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("original_name", sa.String(length=255), nullable=False), sa.Column("storage_path", sa.String(length=1024), nullable=False), sa.Column("public_path", sa.String(length=1024), nullable=False), sa.Column("content_type", sa.String(length=120), nullable=False), sa.Column("size", sa.Integer(), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_uploads_user_id", "uploads", ["user_id"])
    op.create_table("notes", sa.Column("id", sa.String(length=36), primary_key=True), sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("encrypted_title", sa.Text(), nullable=False), sa.Column("encrypted_content", sa.Text(), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_notes_user_id", "notes", ["user_id"])
    op.create_table("contacts", sa.Column("id", sa.String(length=36), primary_key=True), sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("encrypted_name", sa.Text(), nullable=False), sa.Column("encrypted_phone", sa.Text(), nullable=True), sa.Column("encrypted_telegram_username", sa.Text(), nullable=True), sa.Column("encrypted_description", sa.Text(), nullable=True), sa.Column("avatar_file_id", sa.String(length=36), sa.ForeignKey("uploads.id", ondelete="SET NULL"), nullable=True), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_contacts_user_id", "contacts", ["user_id"])
    op.create_table("links", sa.Column("id", sa.String(length=36), primary_key=True), sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("encrypted_title", sa.Text(), nullable=False), sa.Column("encrypted_url", sa.Text(), nullable=False), sa.Column("encrypted_description", sa.Text(), nullable=True), sa.Column("image_file_id", sa.String(length=36), sa.ForeignKey("uploads.id", ondelete="SET NULL"), nullable=True), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_links_user_id", "links", ["user_id"])


def downgrade() -> None:
    op.drop_table("links")
    op.drop_table("contacts")
    op.drop_table("notes")
    op.drop_table("uploads")
    op.drop_table("user_sessions")
    op.drop_table("otp_challenges")
    op.drop_table("users")
