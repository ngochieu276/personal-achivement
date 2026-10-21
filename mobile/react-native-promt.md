# Build prompt — Personal Record mobile (React Native)

Use this for the Expo app in `mobile/`. Take the **latest stable** of each tool. Do **not** pin to versions in this repo’s lockfile.

## Goal

Native iOS + Android client for the same Personal Record API. No marketing site. App opens on **login** or **Projects**.

## Stack

- Expo (managed) + Expo Router + TypeScript
- NativeWind + stormy-morning tokens (same palette as web)
- TanStack Query + Zustand
- JWT in expo-secure-store; locale/view in AsyncStorage
- expo-image-picker / expo-document-picker for uploads
- expo-auth-session for Google (`POST /auth/google` `{ accessToken }`)

Reuse `src/lib/types.ts`, `calendar.ts`, i18n catalogs. Do not add a shared web/mobile package unless asked.

## Layout

Thin `app/**/*.tsx` routes that render `src/views/*`. Tabs: Projects, Calendar, Dashboard, Activities. Stack: project, group, subject, timeline.

## Local simulators

```bash
docker compose up -d
# api on 8080
cd mobile
cp .env.example .env   # optional EXPO_PUBLIC_API_URL
npm install
npx expo start --ios        # iOS Simulator → http://localhost:8080
npx expo start --android    # Android Emulator → http://10.0.2.2:8080
```

`src/lib/api.ts` picks the host from `Platform.OS` unless `EXPO_PUBLIC_API_URL` is set. Native fetch does not use CORS.

## Conventions

- `api<T>()`: Bearer token, JSON unless FormData (`images` / `files` field names)
- Query keys match web: `["nav"]`, `["projects"]`, `["subject", id]`, `["calendar-tasks", from, to]`, `["activities", range]`
- i18n `en` | `vi`, one language toggle on the account menu
- No hardcoded UI strings
- Overflow actions in menus; cards navigate

Do not commit unless asked. Do not change API product behavior.
