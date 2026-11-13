# Bluvi Fitness — App

Expo client for Bluvi Fitness, built with Expo SDK 58 and React Native 0.88.

## Prerequisites

- Bun 1.4 or newer
- Node.js 22.13 or newer (required by Expo SDK 58)
- Expo SDK 58 / React Native 0.88 toolchain

## Get started

1. Install dependencies:

   ```bash
   bun install
   ```

2. Create your local environment file from the example:

   ```bash
   cp .env.example .env.local
   ```

   Only public `EXPO_PUBLIC_*` values belong in app env files. Never put `JWT_SECRET`, Firebase, Gemini, or any other credential here: non-public variables are not inlined into the client bundle, and secrets must stay server-side.

   Public variables:
   - `EXPO_PUBLIC_API_URL` — API base URL
   - `EXPO_PUBLIC_SCHEME` — app URL scheme
   - `EXPO_PUBLIC_POSETRACKER_API_KEY` — PoseTracker key used by the camera-tracking WebView. It is client-visible, so restrict it in the PoseTracker dashboard.

3. Start the app:

   ```bash
   bun run start
   ```

## Scripts

- `bun run start` — start the Expo dev server
- `bun run android` — run on an Android device
- `bun run ios` — run on iOS
- `bun run typecheck` — run the TypeScript compiler
- `bun run lint` — run Expo lint

## Production builds

EAS production Android builds use an app bundle (`.aab`) for the Play Store. Development and preview builds remain APKs. See `eas.json`.

## Security

Credentials were previously committed to this repository. Rotate Firebase, Gemini, JWT, and PoseTracker credentials and purge the leaked files from git history. Never commit `.env*` files or `firebase_config.json`.
