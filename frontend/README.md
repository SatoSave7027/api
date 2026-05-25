# SatoSave Vault — Frontend

Next.js 14 (App Router) + TypeScript + Tailwind + Framer Motion.

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

Edit `.env.local` and point `NEXT_PUBLIC_API_BASE_URL` at your backend (default
`http://localhost:8000`).

## Run

```bash
npm run dev      # http://localhost:3000
```

## Build

```bash
npm run build
npm run start
```

## Pages

- `/` — landing page with download CTA and continue-in-browser CTA.
- `/downloads` — instructions for desktop / mobile builds.
- `/login` — passwordless email-OTP login.
- `/dashboard` — section picker.
- `/dashboard/notes`, `/dashboard/notes/new`, `/dashboard/notes/[id]` — notes CRUD.
- `/dashboard/contacts`, `/dashboard/contacts/new`, `/dashboard/contacts/[id]` — contacts CRUD with avatar upload.
- `/dashboard/links`, `/dashboard/links/new`, `/dashboard/links/[id]` — link library with image upload.
