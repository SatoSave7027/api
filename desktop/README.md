# SatoSave Vault Desktop

Tauri desktop client connected to the FastAPI backend.

```bash
npm install
VITE_API_URL=http://localhost:8000 npm run dev
npm run build
npm run tauri:build
```

`npm run tauri:build` creates a Windows NSIS `.exe` bundle on Windows runners with Rust and WebView2 dependencies installed. The React UI performs real OTP login and vault CRUD calls through the backend API.
