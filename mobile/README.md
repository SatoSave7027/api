# SatoSave Vault — Mobile (Expo / React Native)

Mobile client for SatoSave Vault, built with Expo Router and React Native.

## Stack

- Expo SDK 51
- React Native 0.74
- Expo Router (file-based navigation)
- expo-secure-store + AsyncStorage fallback for tokens
- expo-image-picker for avatar / link uploads
- React Native Animated (built-in) for transitions

## Setup

```bash
cd mobile
npm install
cp .env.example .env
```

Edit `.env` and / or `app.json`'s `expo.extra.apiBaseUrl` if the backend isn't
on `http://localhost:8000`. When testing on a phone, set
`EXPO_PUBLIC_API_BASE_URL` to your machine's LAN IP, e.g.
`http://192.168.1.10:8000`.

## Run in development

```bash
npm start          # opens Expo dev tools; press a for Android, i for iOS
npm run android    # build & launch on connected Android device / emulator
```

## Build the Android .apk

```bash
npm install -g eas-cli
eas login
npm run build:apk     # uses the "preview" profile in eas.json (apk)
```

EAS builds in the cloud and prints a download URL for the `.apk`. To build
locally, see <https://docs.expo.dev/build-reference/local-builds/>.

## App structure

```
mobile/
├── app/
│   ├── _layout.tsx           # AuthProvider + ToastProvider + RouteGuard
│   ├── index.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx         # email → OTP flow
│   └── (app)/
│       ├── _layout.tsx       # native stack
│       ├── home.tsx          # section picker
│       ├── notes/            # list, new, detail
│       ├── contacts/         # list, new, detail
│       └── links/            # list, new, detail
├── components/               # Button, Field, Toast, AvatarPicker, ...
├── lib/                      # api, auth, theme, storage, types
└── assets/                   # icon.png, splash.png
```
