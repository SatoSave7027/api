from cryptography.fernet import Fernet
from app.config import settings
from typing import Optional


def _get_fernet() -> Fernet:
    key = settings.ENCRYPTION_KEY
    if isinstance(key, str):
        key = key.encode()
    return Fernet(key)


def encrypt_text(plaintext: Optional[str]) -> Optional[str]:
    if plaintext is None:
        return None
    fernet = _get_fernet()
    encrypted = fernet.encrypt(plaintext.encode("utf-8"))
    return encrypted.decode("utf-8")


def decrypt_text(ciphertext: Optional[str]) -> Optional[str]:
    if ciphertext is None:
        return None
    fernet = _get_fernet()
    decrypted = fernet.decrypt(ciphertext.encode("utf-8"))
    return decrypted.decode("utf-8")
