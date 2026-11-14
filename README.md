# Bluvi Fitness

Cross-platform fitness app with AI coaching, daily streaks, food tracking and a
community feed.

## Features

- **AI coach** — Gemini-backed chatbot with streaming replies (fitness/health only)
- **AI plans** — daily calorie/macro goals, food suggestions and workout plans derived from the user's profile
- **Food logging** — barcode scanning (OpenFoodFacts) and photo analysis of meals
- **Streaks & daily tasks** — server-computed streaks, calendar, achievements, and randomised daily tasks
- **Blog feed** — posts with images, likes, comments and bookmarks
- **Progress insights** — a 7-day Skia trend chart and a selectable stats date strip, built from a rolling 30-day snapshot of your own data
- **Activity timeline** — completed workouts are logged automatically
- **Reminders** — daily water/workout/streak notifications and a weekly report (local, per device)
- **Camera pose tracking** — rep counting through the PoseTracker WebView
- **Light & dark themes** — one semantic token system (`docs/theming.md`), no per-screen colours
- **English and Mongolian** localisation

## Tech Stack

- **App:** Expo SDK 58 (React Native 0.88), TypeScript, expo-router, NativeWind 4 (Tailwind 3), Zustand
- **Server:** Express 5, TypeScript, MongoDB, Redis, Gemini, Firebase Storage
- **Package manager:** [Bun](https://bun.sh/)

## Project structure

```
app/                     Expo client
  app/                   expo-router routes (tabs, auth, meal, blog, settings, home)
  components/            UI, incl. ui/, home/, meal/, chat/, profile/, register/
  theme/tokens.js        design tokens — single source of truth for colour
  stores/ hooks/ context/ lib/ i18n/
server/                  Express API
  src/controllers  src/models  src/services  src/seed
  public/uploads         local image fallback when Firebase is not configured
docs/                    theming, local testing/seed data, SDK 58 backlog, EAS runbook
```

## Prerequisites

- [Bun](https://bun.sh/) 1.4 or newer
- [Node.js](https://nodejs.org/) 22.13 or newer (required by Expo SDK 58)
- Expo SDK 58 / React Native 0.88 toolchain
- MongoDB (required); Redis is optional — the server falls back to an in-memory cache

## Installation

1. Clone the repository:

```bash
git clone https://github.com/PlexTDM/diploma-SW24-2.git
cd diploma-SW24-2
```

2. Configure environment variables (see [Environment](#environment)).

3. Install server dependencies and start the development server:

```bash
cd server
bun install
bun run dev
```

4. In another terminal, install app dependencies and start the app:

```bash
cd app
bun install
bun run start
```

> Testing locally without Firebase/Gemini/SMTP? Follow
> [docs/local-testing.md](docs/local-testing.md) and run `bun run seed` in
> `server/` to get demo users, posts, streaks and chat history.

## Environment

The app reads public `EXPO_PUBLIC_*` variables from `app/.env.local`. Create it from the example:

```bash
cd app
cp .env.example .env.local
```

| Variable                          | Description                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`             | Base URL of the API server (defaults to `http://localhost:3000`)                             |
| `EXPO_PUBLIC_SCHEME`              | App URL scheme (defaults to `coolfitness`)                                                   |
| `EXPO_PUBLIC_POSETRACKER_API_KEY` | PoseTracker key for the camera-tracking WebView (client-visible; restrict it in PoseTracker) |

Create `server/.env` from `server/.env.example` with the server-side configuration (MongoDB, JWT, Firebase, Gemini, SMTP, Redis, and Google OAuth credentials). Server secrets must never be exposed to the app: non-`EXPO_PUBLIC_*` variables are not inlined into the client bundle, and token-signing secrets (`SECRET_ACCESS_TOKEN`, `SECRET_REFRESH_TOKEN`) must stay server-side.

- **`SECRET_ACCESS_TOKEN` / `SECRET_REFRESH_TOKEN` must be non-empty.** If they exist but are blank, every login answers `500` with `SECRET_ACCESS_TOKEN is not defined`. |

## Documentation

- [Theming & colour system](docs/theming.md) — semantic colour tokens, `ThemeText`/`ThemeView` primitives, dark-mode gotchas, and how to add a token.
- [Local testing & seed data](docs/local-testing.md) — run the API/app without cloud credentials, seed a demo database, troubleshoot the common failures.
- [SDK 58 feature backlog & improvement plan](docs/sdk58-features-and-improvements.md) — what the upgrade unlocked, plus an inventory of stub/mock code with status.
- [EAS simulator runbook](docs/eas-simulator.md) — remote Android testing with EAS.

## Type Checking

```bash
cd app
bun run typecheck
```

```bash
cd server
bun run typecheck
```

## Dependency Policy

- **Expo SDK-managed packages** (`expo-*`, `react-native`, `react-native-*`, `@react-native-*`) stay on the versions bundled with SDK 58. Upgrading them individually is unsupported; wait for the next SDK.
- **React / React DOM** are intentionally on `19.3.1` via `expo.install.exclude`; re-run `expo-doctor` after changing them.
- **Tailwind CSS** is held at `3.x` because NativeWind `4.2.7` does not support Tailwind 4.
- **App toolchain holds:** Babel 7 (the Worklets plugin requires Babel ^7), ESLint 9 (`eslint-plugin-react` / `eslint-plugin-import` do not support ESLint 10), TypeScript 6 (`eslint-config-expo` crashes on TypeScript 7).
- Run `bun outdated` plus `bunx expo-doctor` before bumping anything, and validate with both `expo export --platform android` and `--platform web`.

## Security Notice

> **Warning:** Credentials were previously committed to this repository.
>
> - Rotate all Firebase, Gemini, and JWT secrets, along with any other credentials that were exposed.
> - Purge the leaked files from git history, not just from the current commit. For example, use [`git filter-repo`](https://github.com/newren/git-filter-repo) and coordinate the force-push with your team.
> - Never commit `.env`, `.env.*`, `.env.local`, `.env.eas-simulator`, or `firebase_config.json`. Commit only `.env.example` files with placeholder values.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Gmail - [unnamed0631@gmail.com](mailto:unnamed0631@gmail.com)

Discord - unnamed0631
