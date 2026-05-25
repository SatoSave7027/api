"""Symmetric encryption helpers for user data (Fernet)."""

from __future__ import annotations

from functools import lru_cache
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken

from app.config import settings


class EncryptionError(RuntimeError):
    """Raised when encryption or decryption fails."""


@lru_cache(maxsize=1)
def _get_cipher() -> Fernet:
    key = settings.encryption_key
    if not key:
        raise EncryptionError(
            "ENCRYPTION_KEY is not configured. "
            "Generate one with: "
            "python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
        )
    try:
        return Fernet(key.encode() if isinstance(key, str) else key)
    except (ValueError, TypeError) as exc:
        raise EncryptionError(f"Invalid ENCRYPTION_KEY: {exc}") from exc


def encrypt_text(plain: Optional[str]) -> Optional[str]:
    """Encrypt a plain string. ``None`` is preserved."""

    if plain is None:
        return None
    cipher = _get_cipher()
    token = cipher.encrypt(plain.encode("utf-8"))
    return token.decode("utf-8")


def decrypt_text(token: Optional[str]) -> Optional[str]:
    """Decrypt a stored token back into plain text. ``None`` is preserved."""

    if token is None:
        return None
    cipher = _get_cipher()
    try:
        plain = cipher.decrypt(token.encode("utf-8"))
    except InvalidToken as exc:
        raise EncryptionError("Failed to decrypt value (invalid token).") from exc
    return plain.decode("utf-8")
