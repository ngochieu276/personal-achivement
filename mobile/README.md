# Personal Record mobile

Expo React Native app for iOS and Android. Same API as `web/` — no marketing site. Opens on login or Projects.

## Prerequisites

- Node.js
- API running at http://localhost:8080 (`cd ../api && deno task dev`)
- **iOS:** Xcode + Simulator
- **Android:** Android Studio + an AVD (emulator)

## Setup

```bash
cd mobile
cp .env.example .env   # optional EXPO_PUBLIC_API_URL
npm install
```

The API URL defaults to `http://localhost:8080` on iOS Simulator and `http://10.0.2.2:8080` on Android Emulator. Set `EXPO_PUBLIC_API_URL` in `.env` to override.

## Run

```bash
npm start              # Expo dev server (pick a device in the terminal)
npm run ios            # iOS Simulator
npm run android        # Android Emulator
```

Equivalent:

```bash
npx expo start
npx expo start --ios
npx expo start --android
```

Start the Android emulator first if it is not already running (Android Studio → Device Manager, or `emulator -avd <name>`).

If Expo reports `Failed to resolve the Android SDK path` / `spawn adb ENOENT`, point it at your SDK:

```bash
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools   # Homebrew commandlinetools
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
emulator -avd spike    # or another AVD from `emulator -list-avds`
npx expo start --android
```
