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

- `bun run start` — start the Expo dev server (add `--clear` after changing `EXPO_PUBLIC_*`)
- `bun run android` — run on an Android device
- `bun run ios` — run on iOS
- `bun run typecheck` — run the TypeScript compiler
- `bun run lint` — run Expo lint
- `bun run doctor` — run `expo-doctor`

## Styling

Colours live in one place, `theme/tokens.js`, and are exposed as semantic
Tailwind classes (`bg-card`, `text-muted-foreground`, `border-border`, …) that
adapt to light/dark automatically. Nothing in `components/` should contain a raw
`text-gray-*`, `bg-white` or `dark:` colour utility.

- Full token table, primitives and rules: [`../docs/theming.md`](../docs/theming.md)
- Icons/placeholders take no `className` — use `const { colors } = useAppTheme()`
- Never add CSS variables to a component after its first render on native; it
  makes `react-native-css-interop` remount the subtree (and can crash). See the
  gotchas section of the theming doc.

## Backend

`EXPO_PUBLIC_API_URL` must point at the running API and match its `PORT`. On a
physical device use the machine's LAN IP, not `localhost`. To get a populated
database (demo users, posts, streaks, chat history) run `bun run seed` in
`server/` — see [`../docs/local-testing.md`](../docs/local-testing.md).

## Native modules

`expo-notifications` (reminders) and `expo-mesh-gradient` (training backdrop) are
native modules, so they need a **development build** — plain Expo Go will not
load them, and after adding/upgrading them you must rebuild:

```bash
bun run android   # or: bun run ios
```

The JS still bundles and typechecks without a rebuild; only the runtime features
are unavailable until you do. `expo-mesh-gradient` is native-only, so the web
build guards it out.

## Production builds

EAS production Android builds use an app bundle (`.aab`) for the Play Store. Development and preview builds remain APKs. See `eas.json`.

## Security

Credentials were previously committed to this repository. Rotate Firebase, Gemini, JWT, and PoseTracker credentials and purge the leaked files from git history. Never commit `.env*` files or `firebase_config.json`.
