# SatoSave Vault

A secure, encrypted personal data vault — store your notes, important contacts, and links with zero-password authentication and end-to-end encryption.

---

## Stack

| Layer     | Technology                                          |
|-----------|-----------------------------------------------------|
| Backend   | Python 3.11+, FastAPI, PostgreSQL, SQLAlchemy 2.x, Alembic, JWT, Fernet encryption |
| Frontend  | Next.js 16, React, TypeScript, Tailwind CSS, Framer Motion |
| Desktop   | Tauri 2, React, Vite, TypeScript, Tailwind CSS      |
| Mobile    | Expo 52, React Native, TypeScript, Reanimated       |

---

## Features

- **Passwordless authentication** via email OTP (6-character alphanumeric code)
- **Encrypted Notes** — CRUD with Fernet encryption at rest
- **Important Contacts** — name, phone, Telegram, avatar, encrypted fields
- **Link Library** — title, URL, description, image, encrypted fields
- **File uploads** — avatars and link images stored locally
- **JWT sessions** — 5-hour inactivity timeout, refresh token rotation
- **Rate limiting** on OTP sending

---

## Security

- No passwords — authentication via email OTP only
- OTP stored as SHA-256 hash only
- OTP rate limiting (5 per hour per email)
- Attempt limiting (5 attempts per OTP)
- All sensitive user data encrypted with Fernet (symmetric encryption)
- JWT secret and encryption key only via `.env`
- Sessions expire after 5 hours of inactivity
- PostgreSQL for all persistent storage (no in-memory storage)
- CORS configured per environment
- Users can only access their own data

---

## Project Structure

```
satosave-vault/
├── backend/                   # FastAPI backend
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── routers/           # API endpoints
│   │   ├── services/          # Business logic
│   │   ├── security/          # JWT, Fernet, OTP
│   │   └── utils/             # Auth dependencies
│   ├── alembic/               # Database migrations
│   ├── uploads/               # Uploaded files (gitignored)
│   ├── requirements.txt
│   └── .env.example
├── frontend/                  # Next.js web app
│   ├── app/
│   │   ├── page.tsx           # Landing + login
│   │   └── dashboard/         # Protected dashboard
│   ├── components/
│   ├── lib/
│   └── .env.local.example
├── desktop/                   # Tauri desktop app
│   ├── src/                   # React UI
│   ├── src-tauri/             # Rust/Tauri config
│   └── package.json
├── mobile/                    # Expo/React Native app
│   ├── app/                   # Expo Router screens
│   ├── lib/                   # API client, types
│   └── package.json
├── .gitignore
└── README.md
```

---

## Quick Start

### 1. Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env from example
cp .env.example .env
# Edit .env with your values (see below)

# Generate encryption key
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Paste result into ENCRYPTION_KEY in .env

# Apply database migrations
~/.local/bin/alembic upgrade head

# Start the API server
python3 -m uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### 2. .env Configuration

```env
DATABASE_URL=postgresql://user:password@localhost:5432/satosave
JWT_SECRET_KEY=your-long-random-secret-key
ENCRYPTION_KEY=your-fernet-key-from-command-above=

# SMTP (Mailtrap for dev)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your-mailtrap-user
SMTP_PASSWORD=your-mailtrap-password
SMTP_FROM=noreply@satosave.app

# Or use Resend
# EMAIL_PROVIDER=resend
# RESEND_API_KEY=re_your_key
```

### 3. PostgreSQL Setup

```sql
CREATE DATABASE satosave;
CREATE USER satosave_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE satosave TO satosave_user;
```

### 4. Apply Migrations

```bash
cd backend
~/.local/bin/alembic upgrade head
```

### 5. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000

npm install
npm run dev       # Development: http://localhost:3000
npm run build     # Production build
```

### 6. Desktop App (Tauri)

Prerequisites: [Rust](https://www.rust-lang.org/tools/install) + [Tauri prerequisites](https://tauri.app/start/prerequisites/)

```bash
cd desktop
npm install
npm run dev              # Development
npx tauri build          # Production build → .exe / .msi for Windows
```

The Windows installer is placed in `desktop/src-tauri/target/release/bundle/`.

### 7. Mobile App (Expo)

```bash
cd mobile
npm install
npm start               # Expo dev server

# Build APK for Android
npx eas-cli build --platform android --profile preview
```

Or run directly in Android emulator:
```bash
npm run android
```

---

## API Endpoints

### Auth
| Method | Endpoint             | Description                    |
|--------|----------------------|--------------------------------|
| POST   | /auth/request-code   | Send OTP to email              |
| POST   | /auth/verify-code    | Verify OTP, get tokens         |
| POST   | /auth/refresh        | Refresh access token           |
| POST   | /auth/logout         | Invalidate session             |
| GET    | /auth/me             | Get current user               |

### Notes
| Method | Endpoint       | Description        |
|--------|----------------|--------------------|
| GET    | /notes         | List all notes     |
| POST   | /notes         | Create note        |
| GET    | /notes/{id}    | Get note           |
| PATCH  | /notes/{id}    | Update note        |
| DELETE | /notes/{id}    | Delete note        |

### Contacts
| Method | Endpoint          | Description           |
|--------|-------------------|-----------------------|
| GET    | /contacts         | List all contacts     |
| POST   | /contacts         | Create contact        |
| GET    | /contacts/{id}    | Get contact           |
| PATCH  | /contacts/{id}    | Update contact        |
| DELETE | /contacts/{id}    | Delete contact        |

### Links
| Method | Endpoint       | Description       |
|--------|----------------|-------------------|
| GET    | /links         | List all links    |
| POST   | /links         | Create link       |
| GET    | /links/{id}    | Get link          |
| PATCH  | /links/{id}    | Update link       |
| DELETE | /links/{id}    | Delete link       |

### Uploads
| Method | Endpoint            | Description      |
|--------|---------------------|------------------|
| POST   | /uploads            | Upload file      |
| DELETE | /uploads/{file_id}  | Delete file      |

---

## Verification Commands

```bash
# Backend: syntax check
cd backend
for f in app/**/*.py; do python3 -m py_compile "$f"; done

# Frontend: build check
cd frontend && npm run build

# Desktop: build check
cd desktop && npm run build

# Mobile: TypeScript check
cd mobile && npx tsc --noEmit
```

---

## Environment Variables Reference

| Variable                  | Required | Description                                 |
|---------------------------|----------|---------------------------------------------|
| DATABASE_URL              | ✅       | PostgreSQL connection string                |
| JWT_SECRET_KEY            | ✅       | Secret for JWT signing                      |
| ENCRYPTION_KEY            | ✅       | Fernet key for data encryption              |
| EMAIL_PROVIDER            | ✅       | `smtp` or `resend`                          |
| SMTP_HOST/PORT/USER/PASS  | if smtp  | SMTP credentials                            |
| RESEND_API_KEY            | if resend| Resend API key                              |
| CORS_ORIGINS              | optional | Comma-separated allowed origins             |
| OTP_EXPIRE_MINUTES        | optional | OTP lifetime (default: 10)                  |
| OTP_RATE_LIMIT_PER_HOUR   | optional | Max OTP sends per hour (default: 5)         |
