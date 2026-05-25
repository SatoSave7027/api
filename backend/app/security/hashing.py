import base64
import hashlib
import hmac
import os


def hash_value(value: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", value.encode("utf-8"), salt, 390000)
    return base64.urlsafe_b64encode(salt + digest).decode("utf-8")


def verify_hash(value: str, hashed_value: str) -> bool:
    try:
        raw = base64.urlsafe_b64decode(hashed_value.encode("utf-8"))
        salt = raw[:16]
        expected_digest = raw[16:]
        calculated = hashlib.pbkdf2_hmac("sha256", value.encode("utf-8"), salt, 390000)
        return hmac.compare_digest(expected_digest, calculated)
    except Exception:
        return False
