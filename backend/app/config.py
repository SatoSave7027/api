"""Application configuration loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Strongly-typed application settings sourced from `.env`."""

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = Field(default="SatoSave Vault")
    app_env: str = Field(default="development")
    app_debug: bool = Field(default=False)
    app_host: str = Field(default="0.0.0.0")
    app_port: int = Field(default=8000)

    # Database
    database_url: str = Field(
        default="postgresql+psycopg2://satosave:satosave@localhost:5432/satosave"
    )

    # Security / JWT
    jwt_secret: str = Field(default="change-me-in-production")
    jwt_algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=60)
    refresh_token_expire_minutes: int = Field(default=300)
    session_idle_timeout_minutes: int = Field(default=300)

    # Encryption (Fernet key, 32 url-safe base64 encoded bytes)
    encryption_key: str = Field(default="")

    # OTP configuration
    otp_length: int = Field(default=6)
    otp_ttl_seconds: int = Field(default=600)
    otp_max_attempts: int = Field(default=5)
    otp_request_cooldown_seconds: int = Field(default=60)

    # CORS
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:1420,http://localhost:8081,http://localhost:19006"
    )

    # Email
    email_provider: str = Field(default="smtp")
    email_from: str = Field(default="SatoSave Vault <no-reply@satosave.local>")
    smtp_host: str = Field(default="localhost")
    smtp_port: int = Field(default=587)
    smtp_username: str = Field(default="")
    smtp_password: str = Field(default="")
    smtp_use_tls: bool = Field(default=True)

    resend_api_key: str = Field(default="")

    # Uploads
    upload_dir: str = Field(default="uploads")
    max_upload_size_bytes: int = Field(default=5 * 1024 * 1024)
    public_base_url: str = Field(default="http://localhost:8000")

    @field_validator("cors_origins")
    @classmethod
    def _strip_cors(cls, value: str) -> str:
        return value.strip()

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def upload_path(self) -> Path:
        path = BASE_DIR / self.upload_dir
        path.mkdir(parents=True, exist_ok=True)
        return path


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
