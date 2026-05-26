# SatoSave Vault

SatoSave Vault is a fullstack passwordless vault for encrypted personal notes, important contacts, and saved links. It includes a FastAPI backend, a Next.js web client, a Tauri desktop shell, and an Expo mobile app that all communicate with the same API.

## Stack

- Backend: Python, FastAPI, PostgreSQL, SQLAlchemy 2.x, Alembic, JWT, SMTP email OTP, Pydantic, Fernet encryption, python-dotenv, Uvicorn
- Frontend: Next.js, React, TypeScript, Tailwind CSS, Framer Motion
- Desktop: Tauri, Vite, React, TypeScript
- Mobile: Expo, React Native, TypeScript

## Features

- Passwordless email login with six-character OTP codes
- Access and refresh JWT tokens bound to server-side sessions
- Five-hour inactivity timeout for session refresh and API access
- Encrypted notes, contact details, and link data before database persistence
- Owner-scoped CRUD for notes, important contacts, and link library entries
- Local image upload storage for contact avatars and link images
- Dark black / toxic green / turquoise UI with animated cards and empty states
- Browser, desktop, and mobile clients connected to the real backend API

## Security

- PostgreSQL is the only persistence layer for application data
- OTP codes are generated with `secrets`, stored only as HMAC hashes, expire quickly, and are protected by resend and attempt limits
- JWT secret, OTP secret, database URL, SMTP credentials, and Fernet encryption key are read only from environment variables
- `.env` is ignored by Git and `.env.example` documents required settings
- CORS uses an explicit origin allow-list
- Uploaded images are stored on disk, not as base64 in PostgreSQL
- Every data endpoint checks the authenticated owner before returning or mutating records

## Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Create a Fernet key:

```bash
python3 - <<'PY'
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())
PY
```

Update `.env` with a PostgreSQL database URL, strong secrets, the generated Fernet key, and SMTP/Mailtrap credentials.

Apply migrations and start the API:

```bash
alembic upgrade head
python3 -m uvicorn app.main:app --reload
```

API docs are available at `http://localhost:8000/docs`.

## Frontend setup

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
npm run build
```

## Desktop app

```bash
cd desktop
npm install
VITE_API_URL=http://localhost:8000 npm run dev
npm run build
npm run tauri:build
```

`npm run tauri:build` is ready for Windows runners with Rust and WebView2 tooling installed and produces an NSIS `.exe` bundle.

## Mobile app

```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000 npm run android
```

Build an Android `.apk` with EAS:

```bash
npm install -g eas-cli
eas build -p android --profile preview
```

## Verification commands

```bash
cd backend
pip install -r requirements.txt
python3 -m py_compile app/main.py
python3 -m py_compile app/config.py
python3 -m uvicorn app.main:app --reload

cd ../frontend
npm install
npm run build

cd ../desktop
npm install
npm run build

cd ../mobile
npm install
```

## Project structure

```text
backend/   FastAPI API, SQLAlchemy models, Alembic migrations, encryption, OTP, uploads
frontend/  Next.js browser client
desktop/   Tauri desktop client using the same API
mobile/    Expo React Native mobile client
```
