# SatoSave Vault Mobile

Expo React Native client connected to the FastAPI backend.

```bash
npm install
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000 npm run android
```

Build an Android APK with EAS:

```bash
npm install -g eas-cli
eas build -p android --profile preview
```

The app performs real OTP login, stores tokens in `expo-secure-store`, and uses backend CRUD/upload endpoints for notes, contacts, and links.
