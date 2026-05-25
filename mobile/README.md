# SatoSave Vault Mobile

Mobile-клиент на Expo / React Native с OTP-авторизацией и CRUD для vault данных.

## Возможности

- Request OTP и verify OTP
- Работа с JWT access/refresh
- CRUD:
  - заметки
  - контакты
  - ссылки
- Адаптированный мобильный интерфейс
- Плавные переходы и интерактивные карточки

## Технологии

- Expo
- React Native
- TypeScript

## Настройка

```bash
cd mobile
npm install
```

Создайте `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api/v1
```

Для реального Android-устройства используйте IP вашей машины вместо `10.0.2.2`.

## Запуск

```bash
npm run start
```

## Сборка Android APK

Через EAS Build:

```bash
npx eas build --platform android --profile production
```

или локально через Android toolchain:

```bash
npm run android
```
