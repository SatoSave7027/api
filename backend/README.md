# SatoSave Vault Backend

FastAPI backend для безопасного хранения заметок, контактов и ссылок с авторизацией через email OTP.

## Стек

- Python
- FastAPI
- PostgreSQL
- SQLAlchemy 2.x
- Alembic
- JWT (access + refresh)
- SMTP email OTP
- Pydantic
- cryptography (Fernet)
- python-dotenv
- uvicorn

## Основные функции

- OTP login без паролей
- Регистрация и вход по email + 6-символьному коду (буквы + цифры)
- Хранение OTP только в hashed виде
- Ограничение числа попыток OTP и rate limiting на выдачу кодов
- JWT access/refresh токены
- Ограничение сессии по неактивности (5 часов)
- CRUD заметок, контактов, ссылок
- API upload для изображений
- Шифрование чувствительных полей перед записью в PostgreSQL

## Безопасность

- Все секреты читаются только из `.env`
- `JWT_SECRET_KEY` и `ENCRYPTION_KEY` не хардкодятся
- CORS ограничивается списком `FRONTEND_ORIGINS`
- Пользователь работает только со своими данными
- OTP не хранится в открытом виде
- Refresh токен не продлевается после таймаута неактивности

## Быстрый старт

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## Настройка `.env`

Обязательные переменные:

- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `ENCRYPTION_KEY` (валидный Fernet key)
- SMTP параметры (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`)

Генерация Fernet ключа:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

## Миграции

```bash
cd backend
alembic upgrade head
```

## Запуск API

```bash
cd backend
python -m uvicorn app.main:app --reload
```

Базовый URL API:

`http://localhost:8000/api/v1`

## Проверки

```bash
cd backend
python -m py_compile app/main.py
python -m py_compile app/config.py
```
