# SatoSave Vault — Backend

FastAPI service that powers SatoSave Vault: encrypted personal vault for notes, contacts and links, with passwordless email-OTP authentication.

## Stack

- Python 3.11+
- FastAPI / Uvicorn
- SQLAlchemy 2.x ORM
- Alembic migrations
- PostgreSQL
- JWT (`python-jose`) with refresh-token rotation
- `cryptography` (Fernet) for at-rest field encryption
- SMTP / Resend for email delivery

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Generate fresh secrets and paste them into `.env`:

```bash
python -c "import secrets; print('JWT_SECRET=' + secrets.token_urlsafe(64))"
python -c "from cryptography.fernet import Fernet; print('ENCRYPTION_KEY=' + Fernet.generate_key().decode())"
```

Configure your email provider in `.env` (Mailtrap works great for development).

## Database

Create a Postgres database that matches `DATABASE_URL`, then run migrations:

```bash
alembic upgrade head
```

## Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Interactive docs: <http://localhost:8000/docs>.

## API surface

| Method | Path                  | Description                  |
| ------ | --------------------- | ---------------------------- |
| POST   | `/auth/request-code`  | Issue & email an OTP         |
| POST   | `/auth/verify-code`   | Exchange OTP for token pair  |
| POST   | `/auth/refresh`       | Rotate token pair            |
| POST   | `/auth/logout`        | Revoke current session       |
| GET    | `/auth/me`            | Current user                 |
| GET    | `/notes`              | List notes                   |
| POST   | `/notes`              | Create note                  |
| GET    | `/notes/{id}`         | Fetch a note                 |
| PATCH  | `/notes/{id}`         | Update a note                |
| DELETE | `/notes/{id}`         | Delete a note                |
| GET    | `/contacts`           | List contacts                |
| POST   | `/contacts`           | Create contact               |
| GET    | `/contacts/{id}`      | Fetch a contact              |
| PATCH  | `/contacts/{id}`      | Update a contact             |
| DELETE | `/contacts/{id}`      | Delete a contact             |
| GET    | `/links`              | List links                   |
| POST   | `/links`              | Create link                  |
| GET    | `/links/{id}`         | Fetch a link                 |
| PATCH  | `/links/{id}`         | Update a link                |
| DELETE | `/links/{id}`         | Delete a link                |
| POST   | `/uploads`            | Upload an image              |
| DELETE | `/uploads/{file_id}`  | Delete an upload             |

## Security

- All user-visible secrets (`JWT_SECRET`, `ENCRYPTION_KEY`, SMTP creds) live in `.env` only.
- OTP codes are 6 chars from an unambiguous A-Z/2-9 alphabet, stored as scrypt hashes with per-row salts + pepper, limited TTL, max-attempts, and per-email request cooldown.
- Refresh tokens are rotated on every refresh and bound to an `auth_sessions` row. Sessions become unusable after `SESSION_IDLE_TIMEOUT_MINUTES` of inactivity (default 5h).
- Note titles/content, contact name/phone/telegram/description, and link title/url/description are encrypted with Fernet before storage.
- Uploaded files are namespaced per user and never indexed publicly beyond the deterministic storage path.

## Verification

```bash
python -m py_compile app/main.py app/config.py
```
