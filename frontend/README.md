# SatoSave Vault Frontend

Web-клиент на Next.js с тёмным UI, анимациями Framer Motion и полной интеграцией с backend API.

## Возможности

- Landing page с CTA кнопками
- OTP auth flow: запрос кода, верификация, logout
- Dashboard после входа
- CRUD для:
  - заметок
  - важных контактов
  - библиотеки ссылок
- Загрузка изображений через `/uploads`
- Авто-refresh access token через `/auth/refresh`

## Технологии

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion

## Настройка

```bash
cd frontend
npm install
```

Создайте `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## Запуск

```bash
npm run dev
```

## Сборка

```bash
npm run build
npm run start
```
