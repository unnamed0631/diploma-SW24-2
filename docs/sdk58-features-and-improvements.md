# SDK 58 feature backlog & improvement plan

Written after the Expo 53 → 58 / RN 0.79 → 0.88 upgrade (`dffe299`). Two parts:

1. **What the upgrade unlocked** — new/cool features worth building on SDK 58.
2. **Dead / half-built code** — an inventory of pages and components that are
   empty, mock-only or wired wrong, with a concrete fix plan.

> "Effort" is relative: S ≤ half a day, M ≈ 1-2 days, L ≈ 3+ days.

> **Status:** a remediation pass has landed for the items marked ✅ / **Fixed**
> below (plus the server hardening, the seed script in
> [`local-testing.md`](local-testing.md) and the design-system migration in
> [`theming.md`](theming.md)). Everything unmarked is still open.
>
> Resolved: home cards de-mocked (feature 9), Settings trio (`Notifications`,
> `Privacy`, `CloseFriends`), broken route targets, blog like/bookmark/like-share
> fixes, the training screens, streak/auth hardening, the colour system
> (16 semantic tokens, zero `dark:` colour utilities left), daily stats history
> with the restored Skia chart, the activity timeline, notification scheduling,
> and the first half of the polish bundle.
>
> Still open: friends/social model (the last mock), server-side stats sync,
> a liquid-glass tab bar, and the remaining notification copy/i18n.

---

## Part 1 — Features to build on the new SDKs

### Already adopted (no work left)

- **`expo-router` native tabs / `Stack.Protected` guards** — `app/(tabs)/(profile)/_layout.tsx`
  already uses `Stack.Protected`, and the register flow already uses
  `@expo/ui`'s `PagerView` (`app/(auth)/register.tsx`). Good patterns to copy.
- **`expo-mesh-gradient`, `expo-blur`, `expo-symbols`, `expo-sensors`** are
  installed but barely (or not) used — see below.

### Quick wins (S)

| #   | Feature                                                                                             | SDK                                                 | Where it plugs in                                               | Effort |
| --- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------- | ------ |
| 1   | **Liquid-glass tab bar / cards**                                                                    | `expo-glass-effect` (SDK 58) + existing `expo-blur` | `components/ui/TabBar.tsx`, `components/navigation/*`           | S      |
| 2   | **Mesh-gradient backdrops** instead of the same `lightEffect.jpg`                                   | `expo-mesh-gradient`                                | `home/training/index.tsx`, `Home` FortuneCookie header          | S      |
| 3   | **Animated splash → app handoff** (`SplashScreen.setOptions({fade:true})` + `preventAutoHideAsync`) | `expo-splash-screen` 58                             | `app/_layout.tsx`                                               | S      |
| 4   | **SF Symbols via `expo-symbols`** with Lucide as Android fallback                                   | `expo-symbols`                                      | `components/ui/TabBar.tsx`, `SettingsItem`                      | S      |
| 5   | **Native iOS context menus / Form rows** for Settings                                               | `@expo/ui` (SwiftUI `ContextMenu`, `Form`)          | `app/(settings)/settings.tsx`                                   | S      |
| 6   | **Edge-to-edge + immersive status bar**                                                             | `expo-system-ui`, `expo-navigation-bar` 58          | `app/_layout.tsx` (the `NavigationBar` code is commented out)   | S      |
| 7   | **OCRs / share sheet** for blog posts                                                               | `expo-sharing`, `expo-clipboard`                    | `app/(blog)/[id].tsx` (the `Share` icon currently does nothing) | S      |

### Medium (M)

| #   | Feature                                                        | SDK                                                   | Why it's valuable                                                                                                                                                                                                                               | Effort |
| --- | -------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 8   | **On-device or streamed AI workout tips in the workout sheet** | Gemini (already server-side)                          | The workout modal is static; add "ask the coach about this move" that streams into a sheet                                                                                                                                                      | M      |
| 9   | ✅ **Live pedometer → goal progress everywhere**               | `expo-sensors` `Pedometer`                            | Done: `usePedometer` normalised (`available`/`permissionGranted`/`todaySteps`) and mirrors into `statsStore`; Home cards and `StepsModal` read real values. iOS still uses a ~24h window rather than strict midnight — needs a day-boundary fix | M      |
| 10  | **Health Connect / HealthKit bridge**                          | `react-native-health-connect` + `react-native-health` | `hooks/useHealth.tsx` is a commented stub. Read steps, calories, sleep into `statsStore`                                                                                                                                                        | M      |
| 11  | **Map / route tracking for runs**                              | `react-native-maps` or `expo-maps` (SDK 58)           | Training has no "run" flow; maps would make the cardio tab real                                                                                                                                                                                 | L      |
| 12  | **Push / local reminders for water + streaks**                 | `expo-notifications`                                  | `WaterModal` has 8 fake alarms (`07:00 AM …`, all hard-coded). Wire to real local notifications                                                                                                                                                 | M      |
| 13  | **Fine-grained haptics on every actionable control**           | `expo-haptics` (already used in `TabBar`)             | Buttons, task completion, streak milestones                                                                                                                                                                                                     | S/M    |

### Bigger bets (L)

| #   | Feature                                      | Why                                                                                                       |
| --- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 14  | **Real-time streak / duels with WebSockets** | `profile/tab3.tsx` is a static "You vs Alex" mock; the server already has Redis pub/sub capability        |
| 15  | **Social graph** (followers, close friends)  | Profile shows a hard-coded `0` followers; `CloseFriends` is an empty screen                               |
| 16  | **Offline-first sync** for stats             | `statsStore` and `dailyTaskStore` are AsyncStorage-only and reset per device; add a `stats` sync endpoint |

**Suggested order:** 9 → 5 → 1/2/3 (visual polish bundle) → 12 → 15 → 14.
Items 9 and 15 are the ones that remove the most "it's a mock" smell.

---

## Part 2 — Empty, mock-only or broken code

### A. Empty / stub screens (render a title and nothing else)

| File                                                                                   | State                                                                                 | Fix                                                                                     |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `app/(settings)/Notifications.tsx`                                                     | 9-line placeholder                                                                    | Toggle list backed by `expo-notifications` + AsyncStorage; reuse `SettingsItem`         |
| `app/(settings)/CloseFriends.tsx`                                                      | 9-line placeholder                                                                    | Needs a social model on the server (`following` list on `User`), search + add/remove    |
| `app/(settings)/Privacy.tsx`                                                           | 9-line placeholder                                                                    | Static legal copy (privacy policy/terms) + "delete my data" + "export my data" actions  |
| `app/(auth)/confirm.tsx`                                                               | ~~Broken: returns an HTML `<div>`~~ — **deleted**, it was never registered anywhere   | Done                                                                                    |
| `app/(auth)/password-changed.tsx` / `VerificationSuccess.tsx` / `otp-verification.tsx` | Copy-only screens reached from `ForgotPassword`; no reset endpoints exist server-side | Either implement password reset (OTP code via `sendAuthMail` exists) or delete the flow |
| `hooks/useHealth.tsx`                                                                  | Commented-out Health Connect stub **that returns JSX** (a hook returning a view)      | Replace with a real read hook (see feature 10)                                          |

### B. Mock-only UI (looks real, hard-coded data)

| File                                                                  | Mock                                                                                                                                                                                   | Fix                                                                                                                                                                    |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/home/Sleep.tsx`, `Calories.tsx`, `Training.tsx`           | Literal `12`, `12`, `69` values; `onPress` empty so the modals never open                                                                                                              | Read `useStatsStore()`; open the modals (`SleepModal`, `CaloriesModal` are empty shells — fill them)                                                                   |
| `components/home/StepsModal.tsx`                                      | `todaySteps = "130"`, local `goal` state, `FriendsActivity` is fake                                                                                                                    | Use `usePedometer()` + `setField("stepsGoal")`; friends come from the social graph                                                                                     |
| `components/home/FriendsActivity.tsx`                                 | Two fake friends with placeholder.com avatars                                                                                                                                          | Server friends endpoint                                                                                                                                                |
| `components/home/SleepModal.tsx` / `CaloriesModal.tsx` / `Custom.tsx` | Empty modals (comments "you can add a header here")                                                                                                                                    | Build with `@expo/ui` `DateTimePicker` for sleep start/end + quality slider; calorie modal = today's meals breakdown                                                   |
| `app/(tabs)/stats.tsx`                                                | 7-day strip is not interactive (`handleSelectDate` commented out), meal calories hard-coded, `RDC` commented out, uses `useColorScheme()` instead of `useAppTheme()` (dark-mode split) | ✅ Date strip shows today only (honest), meal rows derive from `dailyFoods`, RDC re-enabled, `useAppTheme()` throughout. Real per-day history still needs a data model |
| `components/profile/tab1.tsx`                                         | Two hard-coded activities (`Indoor Run 5.56km`, `Outdoor Cycle`)                                                                                                                       | Needs an activity/workout log model; until then, read from the seeded `stats.workouts`                                                                                 |
| `components/profile/tab2.tsx`                                         | ~~Skia line chart with hard-coded weekday values~~ — fabricated chart and 246/24k/246 figures **removed**; now shows real today/total values with an honest empty state                | Real 7-day chart needs a daily-stats snapshot model (open)                                                                                                             |
| `components/profile/tab3.tsx`                                         | Static "You vs Alex" duel                                                                                                                                                              | See feature 14                                                                                                                                                         |
| `app/(tabs)/(profile)/profile.tsx`                                    | Flash count `247` hard-coded                                                                                                                                                           | Use `user.totalCalories` / streak                                                                                                                                      |
| `app/home/training/screen1.tsx`                                       | "75 min", "Mnkv" author, equipment list hard-coded                                                                                                                                     | Load the workout by id from the AI plan (`user.stats.workouts`)                                                                                                        |
| `app/home/training/screen2.tsx`                                       | All option chips defined (`timeOptions`, `muscleMap`, `intensityOptions`) but never used; the create button does nothing                                                               | Post to a new `/exercise/plan` endpoint with the selections; show the generated plan                                                                                   |
| `app/home/training/screen3.tsx`                                       | ~~Fully static strength-score mock~~ — **deleted** (unreachable, no data source)                                                                                                       | Done                                                                                                                                                                   |
| `app/(meal)/nemeh.tsx`                                                | "English breakfast / Egg omlete" + hard-coded `120/304 kcal`; search + mic buttons do nothing; favourites are local state                                                              | Search a real food API (OpenFoodFacts is already used in `scan.tsx`); persist favourites                                                                               |
| `app/(meal)/scan.tsx`                                                 | All copy is hard-coded **Mongolian**                                                                                                                                                   | Move strings to `i18n/{en,mn}.json`                                                                                                                                    |
| `components/meal/ProgressAnimation.tsx`                               | UI only, not rendered by the flow (the `asuult*` screens use `QuestionLayout`)                                                                                                         | Either render it during AI generation (image scan does generation) or delete                                                                                           |
| `app/(tabs)/blogs.tsx`                                                | Search box is decorative (`useState` only)                                                                                                                                             | Filter `posts` by `title/content` (or add `?q=` to `GET /post`)                                                                                                        |

### C. Broken wiring (functional bugs)

| File                                                       | Problem                                                                                                                                                                                       | Fix                                                                                                                                                             |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/mnkv.tsx` → `router.push("/asuult")`                  | Route does not exist at the root; lives in `(meal)`                                                                                                                                           | `router.push("/(meal)/asuult")`; delete `mnkv.tsx` (the greeting belongs in `welcome`)                                                                          |
| `app/(meal)/_layout.tsx`                                   | `asuult`, `imageScan`, `scan` are missing from the `Stack` list (deep links fall back to the default screen)                                                                                  | List every screen, set `unstable_settings` to the real entry                                                                                                    |
| `app/(settings)/settings.tsx`                              | Logout calls `router.replace("/(tabs)")` right after `logout()`, but the profile tab guard flips to `login`; the toast/loading is lost                                                        | Navigate to `/(tabs)/(profile)` and let `Stack.Protected` redirect                                                                                              |
| `app/(blog)/[id].tsx`                                      | `toggleLike` is fire-and-forget (optimistic flip only, reverted on refresh); `Share` does nothing; bookmark state is re-read from `"bookMarks"` while `blogStore` writes `"bookmarkedPosts"`  | Await `likePost` and reconcile; add `expo-sharing`; unify the storage key (and fix `PostCard.tsx` too)                                                          |
| `app/stores/blogStore.ts`                                  | `addPost` expects `newPost.data` from the server but `blogStore` callers pass the raw response; `getComments` ignores `loadingComments`                                                       | Fixed in this change (accepts both envelopes); use `useBlogStore(s => s.loadingComments)`                                                                       |
| `app/stores/statsStore.ts`                                 | `calculateStatsFromFoods` **adds** `currentCalories` to `totalCalories` on every toggle; `dailyFoods` entries store strings from Gemini                                                       | Store a daily snapshot instead of a running total                                                                                                               |
| `app/app/_layout.tsx`                                      | `StatusBar hidden={true}` app-wide (system bars hidden), `NavigationBar` code commented out                                                                                                   | ✅ `ThemeProvider` now wraps the tree (StatusBar/stack colours read the real theme); immersive/NavigationBar decision still open                                |
| `components/ui/ThemeText.tsx`                              | Default `text-black dark:text-white` was appended **after** the caller classes, silently overriding `text-white`                                                                              | ✅ Replaced by semantic variants; colour detection is strict (`hasExplicitTextColor`) so size utilities can't suppress `text-foreground`. See `docs/theming.md` |
| `app/context/auth.tsx`                                     | `signInWithApple` posts to `${BASE_URL}/api/auth/apple/apple-native` (no such route); `appleDiscovery` points at `/api/auth/apple/*`; `login` UI's Apple button has no handler (`signup.tsx`) | Add the Apple native route server-side (verify identity token) or hide the buttons on non-iOS                                                                   |
| `app/app/(auth)/signup.tsx`                                | Instagram button does nothing; Apple button has no `onPress`                                                                                                                                  | Remove Instagram; wire Apple                                                                                                                                    |
| `app/components/profile/tab1.tsx` & `app/(tabs)/stats.tsx` | `useColorScheme()` (system) instead of `useAppTheme()` — light content in dark mode                                                                                                           | ✅ Migrated to `useAppTheme()` everywhere (semantic tokens)                                                                                                     |
| `app/home/training/_layout.tsx`                            | ~~`Stack.Screen name="screen3"`… `start`/`test` not registered~~                                                                                                                              | Fixed: `start` + `test` registered, `screen3` gone                                                                                                              |
| `server/test/seedPosts.js`                                 | ~~Imports non-existent modules~~ — **deleted**; superseded by `bun run seed` (`src/seed/seed.ts`)                                                                                             | Done                                                                                                                                                            |

### D. Dead code (`app/components/register/*`)

`step1 … step7`, `StepHeader`, `StepProgressBar`, `progressBar`, `dialogue`,
`ChoiceButton`, `index.js` — the wizard is wired via `app/(auth)/register.tsx`
and looks used, but `components/register/index.js` and several steps still
contain commented "mock data" blocks (e.g. `stores/register.ts` ships mock
gender/weight values with the real defaults commented out).

**Plan:** flip `stores/register.ts` to the empty defaults + validation, and add
one test per step. Also: `register.tsx` `nextDisabeled()` short-circuits to
`false` in development, so step validation is never exercised locally.

### E. Server-side gaps that block the app

| Area        | Gap                                                                                                 | Fix                                                                                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Email       | `sendVerificationEmail` / `verifyEmail` existed but were **not routed**                             | Routes added (`POST/GET /auth/verify-email`, guarded by `503` when SMTP is absent)                                                                        |
| Google      | First sign-in returned `202` "ask to register" and the client showed nothing                        | Now creates the account on first sign-in and returns tokens (needs a one-time "fill in your body stats" onboarding)                                       |
| Apple       | No native endpoint, no discovery endpoints                                                          | Implement or remove (see above)                                                                                                                           |
| Streaks     | `PUT /auth/update` let clients write `streak`/`highestStreak`; cron only reset, never incremented   | Fixed: field allowlist on `/auth/update`, `POST /streak/increment` recomputes the streak from `CompletedDay`, and `/streak/completed-days` resyncs it too |
| Posts       | `description` was `required` but never set by the controller (write failed in Mongoose strict mode) | Now derived from `content`                                                                                                                                |
| `DailyGoal` | Schema used `_id: false` + `timestamps`, so `.save()` threw "document must have an _id"             | Fixed                                                                                                                                                     |
| User model  | Onboarding fields were `required`, so Google/Apple accounts could never be created                  | Defaults added                                                                                                                                            |
| Food plan   | `genFoodPlan` launched Puppeteer for every request (slow, heavy)                                    | Image scraping is now opt-in via `FOODPLAN_SCRAPE_IMAGES=true`                                                                                            |

---

## Suggested sequence

1. ✅ **Unblock local dev** — optional env handling + seed data
   ([`local-testing.md`](local-testing.md)).
2. ✅ **Kill mock data on Home** — cards feed from `statsStore` +
   `usePedometer`; `SleepModal`/`CaloriesModal`/`StepsModal` are real.
3. ✅ **Fix the broken routes** (`mnkv` target, `(meal)` layout, logout, the
   bookmark storage key).
4. ✅ **Settings trio** (`Notifications`, `Privacy`, `CloseFriends`).
5. ✅ **Harden auth/streaks** — `/auth/update` allowlist + server-computed
   streaks, Apple/Instagram buttons no longer pretend to work.
6. **Social graph** — unlocks `CloseFriends` content, `FriendsActivity`,
   followers, duels (`tab3`). Requires a `Following`/`Friendship` model.
7. ✅ **Daily stats history** — `statsStore` keeps a rolling 30-day window
   (`history: DaySnapshot[]`, written on every stats change and preserved on the
   day rollover). The Skia line chart is back (`components/profile/tab2.tsx`)
   and driven by it, and the Stats tab's date strip is selectable per recorded
   day. Client-side only for now — a server snapshot table would sync across
   devices.
8. ✅ **Activity log** — `stores/activityStore.ts` (persisted, 200 entries) +
   Timeline UI in `components/profile/tab1.tsx`. Completed pose-tracking
   sessions are recorded automatically. Meals/streaks can be added by calling
   `addEntry`.
9. ✅ **Notifications scheduling** — `expo-notifications` installed and wired
   through `utils/notifications.ts`: the Settings screen now requests
   permission, schedules daily water/streak/workout reminders + a weekly report,
   re-syncs on toggle, and offers a test notification. **Requires a new
   development build** (native module).
10. ✅ **Polish bundle (partial)** — splash fade, mesh-gradient backdrop on the
    training screen (`expo-mesh-gradient`, native only), SF Symbols in the tab
    bar on iOS (`expo-symbols`). Liquid-glass tab bar is still open
    (`expo-glass-effect` would need installing + a rebuild).

### Leftovers worth knowing about

- `app/components/WorkoutModal.tsx` is no longer used by the training flow
  (navigation replaced it); it is still valid and can be reused as a bottom
  sheet.
- `app/components/home/CircleProgress.tsx` is unused; if it gets adopted, move
  its default `#3b82f6`/`#e5e7eb` props to `colors.primary`/`colors.muted`
  (they are defaults, so they cannot read the hook).
- `app/components/ui/Modal.tsx` is an empty file (0 bytes) — delete or implement.
- `app/components/register/progressBar.tsx` is a legacy duplicate of
  `StepProgressBar` and is not used by the wizard.
- `app/hooks/useHealth.tsx` still returns JSX from a hook — it is not imported
  anywhere, but it should be rewritten or deleted before anyone uses it.
- `app/utils/handleAppleError.ts` is now unused after the Apple cleanup.
- Strings added by the remediation pass are English-only in a few places (the
  `settings` trio is fully translated in `en`/`mn`; Home modal labels such as
  "Sleep start" are inline English).

### Design system (done)

- `app/theme/tokens.js` is the single source of truth (16 tokens × light/dark);
  `tailwind.config.js` turns them into semantic utilities and paired CSS
  variables, `lib/theme.tsx` supplies `useAppTheme().colors` for props.
- 75 of the 114 `.tsx` files now use semantic tokens (the rest are markup-only
  or the documented decorative exceptions); **zero** `dark:` colour utilities
  remain anywhere.
- Two traps are documented in [`theming.md`](theming.md): variables added after
  the first render (native remount + `LinkingContext` crash) and treating
  `text-lg`/`text-center` as a colour (black text in dark mode).
