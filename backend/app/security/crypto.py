from cryptography.fernet import Fernet

from app.config import get_settings

settings = get_settings()
fernet = Fernet(settings.encryption_key.encode("utf-8"))


def encrypt_text(value: str | None) -> str | None:
    if value is None:
        return None
    return fernet.encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_text(value: str | None) -> str | None:
    if value is None:
        return None
    return fernet.decrypt(value.encode("utf-8")).decode("utf-8")
