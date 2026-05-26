# SatoSave Vault Frontend

Next.js web client for the SatoSave Vault API.

```bash
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
npm run build
```

The client requests OTP email codes, verifies sessions, refreshes JWT tokens, performs CRUD operations against the backend, and uploads/deletes contact and link images through `/uploads`.
