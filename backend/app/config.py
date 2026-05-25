from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "SatoSave Vault API"
    app_env: str = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/satosave_vault"

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15

    session_idle_timeout_hours: int = 5
    session_max_days: int = 30

    otp_expiration_minutes: int = 10
    otp_max_attempts: int = 5
    otp_request_cooldown_seconds: int = 60
    otp_request_limit_per_hour: int = 5

    smtp_host: str
    smtp_port: int = 2525
    smtp_username: str
    smtp_password: str
    smtp_from_email: str
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False

    frontend_origins: List[AnyHttpUrl | str] = Field(default_factory=list)
    encryption_key: str

    upload_dir: str = "uploads"
    max_upload_size_mb: int = 8
    token_cookie_name: str = "satosave_refresh_token"

    @field_validator("frontend_origins", mode="before")
    @classmethod
    def parse_frontend_origins(cls, value: str | list[str] | None) -> list[str]:
        if value is None:
            return []
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
