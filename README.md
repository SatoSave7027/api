# SatoSave Vault

> Passwordless, end-to-end-encrypted personal vault for **notes**, **important contacts** and a **link library**. Built as a portfolio-quality fullstack project with web, desktop and mobile clients sharing the same backend.

```
┌──────────────────┐    ┌──────────────────────────┐    ┌──────────────────┐
│  Next.js (web)   │    │                          │    │  Expo (Android)  │
├──────────────────┤    │                          │    ├──────────────────┤
│  Tauri (Windows) │ ──►│  FastAPI + PostgreSQL    │◄── │     ...          │
├──────────────────┤    │  JWT + Email OTP + Fernet │    └──────────────────┘
│  Future iOS/mac… │    └──────────────────────────┘
└──────────────────┘
```

## What's inside

| Folder      | What it is                                      | Stack                                    |
| ----------- | ----------------------------------------------- | ---------------------------------------- |
| `backend/`  | FastAPI service, encrypted storage, OTP auth    | Python 3.11+, FastAPI, SQLAlchemy 2, Alembic, PostgreSQL, JWT, Fernet |
| `frontend/` | Web client + landing page                       | Next.js 14 (App Router), TypeScript, Tailwind, Framer Motion |
| `desktop/`  | Native desktop client, builds to a single `.exe` | Tauri 1.6 (Rust shell) + Vite + React + Tailwind + Framer Motion |
| `mobile/`   | Mobile client, builds to a single `.apk`         | Expo SDK 51, Expo Router, React Native, expo-secure-store, expo-image-picker |

## Features

### Authentication (passwordless)
- User enters their email → backend issues a 6-character A–Z/2–9 OTP.
- OTP is hashed (scrypt + pepper + per-row salt) and stored with a short TTL.
- Rate-limited per email; attempts capped; codes single-use.
- OTP is **sent by real email** (SMTP or Resend; Mailtrap for dev).
- Successful verification creates the account (if needed) and starts a session.
- Returns `access_token` + `refresh_token` (JWT).
- Refresh tokens are rotated on every refresh, bound to a server-side `auth_sessions` row.
- Sessions are revoked after **5 hours of inactivity** — refresh stops working until the user reauthenticates with a new OTP.

### Vault data
- **Notes** — title + content, full CRUD.
- **Important contacts** — name (required), phone, Telegram username, description, avatar; at least one of `phone` or `telegram_username` is required (enforced both in schemas and on update).
- **Link library** — title + URL (required), description, image.
- All sensitive fields (titles, content, phones, Telegram handles, descriptions, URLs) are **encrypted with Fernet** before insertion into PostgreSQL. Only `id`, `user_id`, timestamps and storage paths stay plain.

### Uploads
- `POST /uploads` accepts a single image (PNG/JPG/WEBP/GIF), max 5 MB, namespaced per-user under `uploads/{user_id}/…`.
- `DELETE /uploads/{file_id}` removes the file from disk and the DB record.

### Web / Desktop / Mobile UI
- Dark, black, toxic-green + aqua palette.
- Framer Motion / React Native Animated for hover, page, list and toast transitions.
- Empty states for every list.
- Responsive: works on phones and large displays.

## Security

- Secrets live **only** in `.env`. `.gitignore` excludes `.env`, `.env.*.local` etc.
- `backend/.env.example` documents every variable; generate fresh values per environment.
- `JWT_SECRET` and `ENCRYPTION_KEY` are required and never embedded in code.
- CORS is restricted to the configured client origins.
- All endpoints under `/notes`, `/contacts`, `/links`, `/uploads`, `/auth/me` require a valid `Bearer` access token and scope queries to `user_id`, so users only ever see their own data.
- Errors return clean JSON `{"detail": "..."}` with appropriate HTTP status codes (400 / 401 / 403 / 404 / 409 / 413 / 415 / 422 / 429 / 502).

## Quick start

### 1) Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Generate strong secrets and paste into .env:
python -c "import secrets; print('JWT_SECRET=' + secrets.token_urlsafe(64))"
python -c "from cryptography.fernet import Fernet; print('ENCRYPTION_KEY=' + Fernet.generate_key().decode())"
# Configure SMTP (Mailtrap recommended for dev) or RESEND_API_KEY in .env

# Create a PostgreSQL database and update DATABASE_URL in .env, then:
alembic upgrade head

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# Swagger UI: http://localhost:8000/docs
```

### 2) Frontend (web)

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev         # http://localhost:3000
npm run build       # production build
```

### 3) Desktop (Tauri → Windows .exe)

Install Rust + your platform's WebView2 / build tools (see `desktop/README.md`).

```bash
cd desktop
npm install
cp .env.example .env
npm run tauri:dev          # development with hot reload
npm run tauri:build        # produces src-tauri/target/release/satosave-vault-desktop.exe
                           # + installers under src-tauri/target/release/bundle/{nsis,msi}/
```

### 4) Mobile (Expo → Android .apk)

```bash
cd mobile
npm install
cp .env.example .env
# Edit .env or app.json's expo.extra.apiBaseUrl to point at your backend's LAN IP.

npm start                  # Expo dev server
npm install -g eas-cli
eas login
npm run build:apk          # cloud build, produces a downloadable .apk
```

For local Android builds without EAS, see <https://docs.expo.dev/build-reference/local-builds/>.

## API

Base path: `/`. All examples assume `http://localhost:8000`.

### Auth

```
POST /auth/request-code        { email }
POST /auth/verify-code         { email, code }      → TokenPair
POST /auth/refresh             { refresh_token }    → TokenPair (rotated)
POST /auth/logout              { refresh_token }    → 200
GET  /auth/me                  Bearer access_token  → UserOut
```

### Vault (all require Bearer access_token)

```
GET    /notes
POST   /notes
GET    /notes/{id}
PATCH  /notes/{id}
DELETE /notes/{id}

GET    /contacts
POST   /contacts
GET    /contacts/{id}
PATCH  /contacts/{id}
DELETE /contacts/{id}

GET    /links
POST   /links
GET    /links/{id}
PATCH  /links/{id}
DELETE /links/{id}

POST   /uploads       (multipart/form-data, field "file")
DELETE /uploads/{file_id}
```

Full OpenAPI schema is auto-generated at `GET /openapi.json` and the interactive docs at `GET /docs`.

## Verification commands

```bash
# Backend syntax / import sanity
cd backend
python -m py_compile app/main.py app/config.py

# Frontend
cd ../frontend && npm install && npm run build

# Desktop frontend (Vite)
cd ../desktop && npm install && npm run build
# Full native build:
# npm run tauri:build

# Mobile typecheck and config validation
cd ../mobile && npm install && npx tsc --noEmit && npx expo config --type prebuild --json > /dev/null
```

## Project structure

```
SatoSaveVault/
├── README.md
├── .gitignore
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── security/
│   │   └── utils/
│   ├── alembic/
│   │   └── versions/0001_initial.py
│   ├── alembic.ini
│   ├── uploads/
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # UI, Navbar, AvatarUpload, Toast, …
│   ├── lib/             # api client, auth context, types
│   ├── styles/
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── README.md
├── desktop/
│   ├── src/             # React + Vite UI (mirrors web)
│   ├── src-tauri/       # Rust shell, tauri.conf.json
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── README.md
└── mobile/
    ├── app/             # Expo Router (auth + app groups)
    ├── components/      # Button, Field, Toast, AvatarPicker, …
    ├── lib/             # api, auth, theme, types, storage
    ├── assets/
    ├── package.json
    ├── app.json
    ├── eas.json
    └── README.md
```

## License

This project is provided as-is for portfolio purposes.
