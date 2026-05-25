# SatoSave Vault — Desktop (Tauri)

Native Windows / macOS / Linux build of the SatoSave Vault client. Same UI as
the web app, connected to the same backend API.

## Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS
- Framer Motion
- react-router-dom (hash router for Tauri-friendly routing)
- Tauri 1.6 (Rust)

## Prerequisites

- Node.js 18+
- Rust toolchain (`rustup`) with the latest stable
- On Windows: WebView2 (preinstalled on Windows 11), Visual Studio Build Tools
- On Linux: `libwebkit2gtk-4.0-dev`, `libgtk-3-dev`, `libsoup2.4-dev`, `librsvg2-dev`, `libssl-dev`, `pkg-config`

See [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites).

## Setup

```bash
cd desktop
npm install
cp .env.example .env
```

Set `VITE_API_BASE_URL` in `.env` if your backend is not on
`http://localhost:8000`.

## Run in dev (browser only)

```bash
npm run dev      # vite dev server on http://localhost:1420
```

## Run the Tauri shell in dev

```bash
npm run tauri:dev
```

## Build production .exe (Windows)

```bash
npm run tauri:build
```

This will:

1. Run `npm run build` (TypeScript + Vite production build into `dist/`).
2. Compile the Rust shell from `src-tauri/`.
3. Produce installers under `src-tauri/target/release/bundle/`:
   - `nsis/SatoSave Vault_1.0.0_x64-setup.exe`
   - `msi/SatoSave Vault_1.0.0_x64_en-US.msi`

The plain `.exe` binary is at
`src-tauri/target/release/satosave-vault-desktop.exe`.

## Build for other platforms

Same `npm run tauri:build` command on Linux / macOS produces native bundles
for that host platform.
