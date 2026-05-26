# SatoSave Vault Backend

FastAPI backend for passwordless OTP authentication, encrypted vault data, PostgreSQL persistence, and local image uploads.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python3 -m uvicorn app.main:app --reload
```

Generate `ENCRYPTION_KEY` with:

```bash
python3 - <<'PY'
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())
PY
```

Use Mailtrap or a real SMTP provider for OTP delivery. The API intentionally fails OTP requests with `503` when SMTP is not configured, so authentication never silently falls back to fake delivery.
