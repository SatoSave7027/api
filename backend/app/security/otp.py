import secrets
import string
import hashlib
from typing import Tuple


OTP_ALPHABET = string.ascii_uppercase + string.digits


def generate_otp(length: int = 6) -> str:
    return "".join(secrets.choice(OTP_ALPHABET) for _ in range(length))


def hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.upper().encode("utf-8")).hexdigest()


def verify_otp(plain_otp: str, hashed_otp: str) -> bool:
    return hash_otp(plain_otp) == hashed_otp
