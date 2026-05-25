import hashlib
import hmac

from app.config import get_settings


def hmac_hash(value: str, purpose: str) -> str:
    settings = get_settings()
    secret = settings.otp_secret if purpose == "otp" else settings.jwt_secret
    return hmac.new(secret.encode("utf-8"), value.encode("utf-8"), hashlib.sha256).hexdigest()


def verify_hash(value: str, expected_hash: str, purpose: str) -> bool:
    return hmac.compare_digest(hmac_hash(value, purpose), expected_hash)
