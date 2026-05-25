# SatoSave Vault Desktop

Desktop-клиент на Tauri + React/Vite с реальной работой через backend API.

## Возможности

- OTP login (request + verify)
- JWT access/refresh через backend
- CRUD:
  - заметки
  - контакты
  - ссылки
- Анимированные переходы через Framer Motion

## Технологии

- Tauri
- React
- TypeScript
- Vite
- Framer Motion

## Настройка

```bash
cd desktop
npm install
```

Создайте `.env` при необходимости:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Запуск web shell

```bash
npm run dev
```

## Production build (frontend assets)

```bash
npm run build
```

## Сборка Windows `.exe` (Tauri bundle)

На Windows (или CI с Windows target):

```bash
npm run tauri:build -- --target x86_64-pc-windows-msvc
```
