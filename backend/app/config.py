from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
import os


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_HOURS: int = 5
    ENCRYPTION_KEY: str

    APP_ENV: str = "development"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:1420"
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 5

    SMTP_HOST: str = "smtp.mailtrap.io"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@satosave.app"
    SMTP_TLS: bool = True

    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@satosave.app"
    EMAIL_PROVIDER: str = "smtp"

    OTP_EXPIRE_MINUTES: int = 10
    OTP_MAX_ATTEMPTS: int = 5
    OTP_RATE_LIMIT_PER_HOUR: int = 5

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
