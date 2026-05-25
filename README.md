# SatoSave Vault

SatoSave Vault — fullstack-платформа для безопасного хранения личных данных пользователя:

- заметки
- важные контакты
- библиотека ссылок

Проект включает:

- backend (FastAPI + PostgreSQL)
- frontend (Next.js)
- desktop app (Tauri)
- mobile app (Expo / React Native)

## Стек

### Backend

- Python
- FastAPI
- PostgreSQL
- SQLAlchemy 2.x
- Alembic
- JWT auth (access + refresh)
- SMTP email OTP
- Pydantic
- cryptography (Fernet)
- python-dotenv
- uvicorn

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion

### Desktop

- Tauri
- React + TypeScript + Vite

### Mobile

- Expo
- React Native
- TypeScript

## Ключевые функции

- Регистрация/вход без пароля (email + OTP)
- OTP:
  - 6 символов (буквы + цифры)
  - hash-хранение
  - ограничение попыток
  - rate limit выдачи кодов
- Сессии:
  - неактивность > 5 часов = повторный вход
  - refresh работает только в рамках активной сессии
- CRUD:
  - `/notes`
  - `/contacts`
  - `/links`
- Upload API для изображений:
  - `/uploads`
- Шифрование чувствительных данных перед записью в PostgreSQL:
  - note title/content
  - contact phone/telegram/description
  - link title/url/description

## Безопасность

- Секреты только в `.env`
- `.env` не коммитится
- `.env.example` в backend
- CORS ограничен списком trusted origins
- JWT secret из env
- Encryption key из env
- Пользователь изолирован своими `user_id`-данными
- Нормальные HTTP status codes + JSON ошибки
- PostgreSQL вместо in-memory хранилища

## Структура проекта

```text
backend/
  app/
    config.py
    database.py
    main.py
    models/
    routers/
    schemas/
    security/
    services/
    utils/
  alembic/
  uploads/
  requirements.txt
  .env.example
  README.md

frontend/
  app/
  components/
  lib/
  styles/
  package.json
  README.md

desktop/
  src/
  src-tauri/
  package.json
  tauri.conf.json
  README.md

mobile/
  app/
  components/
  package.json
  app.json
  README.md
```

## Запуск Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Сгенерировать Fernet key:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Применить миграции:

```bash
alembic upgrade head
```

Запустить API:

```bash
python -m uvicorn app.main:app --reload
```

## Запуск Frontend

```bash
cd frontend
npm install
npm run build
npm run dev
```

Создать `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## Сборка Desktop (.exe)

```bash
cd desktop
npm install
npm run build
npm run tauri:build -- --target x86_64-pc-windows-msvc
```

## Сборка Mobile (.apk)

```bash
cd mobile
npm install
npx eas build --platform android --profile production
```

Для local Android emulator:

```bash
npm run android
```

## Команды проверки

Backend:

```bash
cd backend
pip install -r requirements.txt
python -m py_compile app/main.py
python -m py_compile app/config.py
python -m uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run build
```

Desktop:

```bash
cd desktop
npm install
npm run build
```

Mobile:

```bash
cd mobile
npm install
```
