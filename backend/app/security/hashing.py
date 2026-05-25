"""Constant-time hashing helpers for OTP codes and refresh tokens."""

from __future__ import annotations

import hashlib
import hmac
import secrets
from typing import Final

from app.config import settings


_SCRYPT_N: Final[int] = 2 ** 14
_SCRYPT_R: Final[int] = 8
_SCRYPT_P: Final[int] = 1
_SCRYPT_DKLEN: Final[int] = 32


def _pepper() -> bytes:
    return settings.jwt_secret.encode("utf-8")


def hash_otp(code: str, *, salt: bytes | None = None) -> str:
    """Hash an OTP code using scrypt and return a salt$hash string."""

    if salt is None:
        salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password=code.encode("utf-8") + _pepper(),
        salt=salt,
        n=_SCRYPT_N,
        r=_SCRYPT_R,
        p=_SCRYPT_P,
        dklen=_SCRYPT_DKLEN,
    )
    return f"{salt.hex()}${digest.hex()}"


def verify_otp(code: str, stored: str) -> bool:
    """Constant-time verification of a candidate OTP against the stored hash."""

    try:
        salt_hex, digest_hex = stored.split("$", 1)
    except ValueError:
        return False
    try:
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(digest_hex)
    except ValueError:
        return False
    candidate = hashlib.scrypt(
        password=code.encode("utf-8") + _pepper(),
        salt=salt,
        n=_SCRYPT_N,
        r=_SCRYPT_R,
        p=_SCRYPT_P,
        dklen=_SCRYPT_DKLEN,
    )
    return hmac.compare_digest(candidate, expected)


def hash_refresh_token(token: str) -> str:
    """Hash a refresh token using SHA-256 (token already has high entropy)."""

    mac = hmac.new(_pepper(), token.encode("utf-8"), hashlib.sha256)
    return mac.hexdigest()


def verify_refresh_token(token: str, stored_hash: str) -> bool:
    candidate = hash_refresh_token(token)
    return hmac.compare_digest(candidate, stored_hash)
