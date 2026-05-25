from functools import lru_cache
from pathlib import Path

from cryptography.fernet import Fernet
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SatoSave Vault API"
    environment: str = "development"
    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 15
    session_idle_hours: int = 5
    session_lifetime_days: int = 30
    otp_secret: str
    otp_ttl_minutes: int = 10
    otp_resend_seconds: int = 60
    otp_hourly_limit: int = 5
    encryption_key: str
    frontend_origins: str = "http://localhost:3000,http://localhost:5173"
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None
    smtp_use_tls: bool = True
    public_upload_base_url: str = "/media"
    upload_max_mb: int = Field(default=5, ge=1, le=25)

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("encryption_key")
    @classmethod
    def validate_encryption_key(cls, value: str) -> str:
        Fernet(value.encode("utf-8"))
        return value

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]

    @property
    def uploads_dir(self) -> Path:
        return Path(__file__).resolve().parent.parent / "uploads"


@lru_cache
def get_settings() -> Settings:
    return Settings()
