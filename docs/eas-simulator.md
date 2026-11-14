# EAS Simulators runbook: remote Android testing (SDK 58)

Last verified: **2026-11-14**
Project: **`app/`** (the Expo project inside this repository)
EAS project ID: **`90489b54-2458-4406-a394-e31059a52f0f`**
Expo account / owner: **`unnamed0631`**
Android package: **`com.unnamed0631.coolfitness`**
URL scheme: **`coolfitness`**

**Current status: blocked on authentication.** EAS CLI is not logged in, and the availability check returns the login requirement. See [Blocked here](#blocked-here). No simulator session, EAS build, or login was attempted while preparing this runbook.

The SDK 58 upgrade **has landed** (`dffe299`): `app/package.json` runs `expo ~58.0.25` / React Native `0.88.1`, and every companion Expo package is on SDK 58. Section 3.2 is still worth running before a build as a config check.

> Commands below use `bunx eas-cli@latest`, which resolved **`eas-cli/27.9.0 linux-x64 node-v26.13.1`** here. If EAS CLI is installed globally, replace it with `eas`. The `simulator:*` commands are experimental; run `bunx eas-cli@latest simulator:start --help` to see the flags your installed version actually supports.

---

## 0. Copy-paste sequence after you are unblocked

```sh
cd app
bun install
bunx eas-cli@latest whoami
bunx eas-cli@latest simulator:availability --json
```

Stop if `whoami` says `Not logged in` or `available` is `false`.

```sh
# Confirm .env.eas-simulator stays ignored; optionally add it to app/.easignore (see section 1).
# Build the development APK only after the parallel SDK 58 upgrade reports complete.
bunx eas-cli@latest build --platform android --profile development --non-interactive

# Find the finished development APK and copy its "id" field.
bunx eas-cli@latest build:list --platform android --status finished --json --non-interactive

# In a second terminal, from app/, start Metro's public tunnel before the session.
EXPO_UNSTABLE_TUNNEL_V2=1 npx expo start --tunnel

# Start the remote Android session with the build and Metro URL.
bunx eas-cli@latest simulator:start \
  --platform android \
  --type agent-device \
  --name "SDK58 Android smoke test" \
  --build-id "<BUILD_ID>" \
  --device medium_phone \
  --max-duration-minutes 40 \
  --open-url "coolfitness://expo-development-client/?url=<URL_ENCODED_METRO_URL>" \
  --non-interactive

# Confirm IN_PROGRESS and remoteConfig before doing anything else.
bunx eas-cli@latest simulator:get --json --non-interactive
```

Drive the app and collect evidence (sections 6 and 7), then always clean up:

```sh
bunx eas-cli@latest simulator:stop
```

---

## 1. Prerequisites

### 1.1 EAS CLI latest

The `simulator:*` commands are experimental and change frequently. Use the latest EAS CLI, and use `--help` rather than assuming a flag exists.

```sh
cd app
bunx eas-cli@latest --version
bunx eas-cli@latest simulator:start --help
```

Verified here: `eas-cli/27.9.0 linux-x64 node-v26.13.1`.

### 1.2 Expo account with paid Simulators access

Expo Simulators is available on the **Starter, Production, and Enterprise** plans. The account that owns the project (currently `unnamed0631`) must have access. The read-only check is in [section 2](#2-access-check).

### 1.3 Authenticate

On an interactive machine:

```sh
cd app
bunx eas-cli@latest login
bunx eas-cli@latest whoami
```

In CI or a headless environment, provide an Expo access token in `EXPO_TOKEN` instead of an interactive login. Never print, commit, paste, or log the token. Do not put it in this document.

### 1.4 Project already linked

`app/app.json` already contains:

```json
"extra": {
  "eas": {
    "projectId": "90489b54-2458-4406-a394-e31059a52f0f"
  }
},
"owner": "unnamed0631"
```

Do **not** run `eas init` for this project. Run all EAS commands from **`app/`**, not the repository root; the repo root is not the Expo project and `simulator:availability` fails there.

### 1.5 Install dependencies first

The parallel upgrade installed `app/node_modules` and added `app/bun.lock`. `app/package.json` declares `"packageManager": "bun@1.4.4"`. Keep dependencies in sync from `app/` before running EAS commands:

```sh
cd app
bun install
```

An earlier check, before those files existed, failed on the `expo-build-properties` config plugin because `node_modules` was absent. That is resolved; the availability command now reaches the authentication check. Do not modify `package.json` just to run the checks.

### 1.6 `.env.eas-simulator` must stay gitignored

EAS CLI writes the active session ID and controller credentials to **`.env.eas-simulator`** in the project directory (`app/.env.eas-simulator` for this repo). It is currently ignored by both:

- `app/.gitignore` line 10: `.env.eas-simulator`
- repository-root `.gitignore` line 84: `.env.eas-simulator`

Verified with:

```sh
git check-ignore -v app/.env.eas-simulator .env.eas-simulator
# app/.gitignore:10:.env.eas-simulator	app/.env.eas-simulator
# .gitignore:84:.env.eas-simulator	.env.eas-simulator
```

Keep those rules. If the ignore files are rearranged, `.env.eas-simulator` must remain covered.

**Extra hardening:** `app/.easignore` exists and does **not** list `.env.eas-simulator`. EAS Build uses `.easignore` for uploads when it is present. Add this line there so a session token cannot be uploaded by a later build:

```gitignore
.env.eas-simulator
```

This runbook does not modify any ignore file; make that change yourself before starting a session.

### 1.7 Why the file must never be printed or committed

`.env.eas-simulator` contains the session ID and the controller connection secret, depending on session type:

| Session type       | Secret-bearing connection variables                              |
| ------------------ | ---------------------------------------------------------------- |
| `agent-device`     | `AGENT_DEVICE_DAEMON_BASE_URL`, `AGENT_DEVICE_DAEMON_AUTH_TOKEN` |
| `argent`           | `ARGENT_TOOLS_URL`, and when required `ARGENT_AUTH_TOKEN`        |
| `appium`           | `APPIUM_URL`, `APPIUM_CAPS`                                      |
| `web-preview-only` | Session ID only                                                  |

The token lets a controller reach the remote device. `remoteConfig` in `simulator:get --json` output is equally sensitive. Do not run `cat`, `env`, or `printenv` on this file in a shared terminal, CI log, or agent transcript, and do not commit it. After a session stops, EAS CLI resets the file to only its comment header; still leave it ignored.

---

## 2. Access check

Run from the Expo project directory:

```sh
cd app
bunx eas-cli@latest simulator:availability --json
```

An enabled account returns the shape:

```json
{
  "available": true,
  "accountName": "<your-account>"
}
```

The check is **read-only**. It does not start a device and does not consume simulator usage.

If the result is:

```json
{
  "available": false,
  "accountName": "<your-account>",
  "billingUrl": "<account billing URL>"
}
```

then **do not call `simulator:start`**. `available: false` means the current project's account does not have Expo Simulators access: the account is not on an eligible paid plan, or billing is past due. Use the returned `billingUrl` to fix billing, or upgrade the account. For an annual Enterprise plan, contact the Expo account executive. Do not retry `simulator:start`; it will fail with a message linking to the billing page.

---

## 3. Build and install the app on Android

### 3.1 Prefer a development build, not Expo Go

Use a **development build** for this project because it uses `expo-dev-client` and custom native modules, including `@shopify/react-native-skia`, `expo-camera`, `expo-sensors`, `expo-secure-store`, `expo-localization`, and others.

Do **not** use `--expo-go` for this app:

- Expo Go supports only projects with **no custom native code**. This project has custom native modules.
- The project runs **SDK 58** (`expo: ~58.0.25`). Use a development build regardless of Expo Go availability.
- Even after it ships, Expo Go cannot load these native modules.

A development build also lets you connect to Metro and use Fast Refresh for live code changes. Rebuild the development client from the upgraded source; do not reuse an older SDK 53 dev build.

### 3.2 Gate: SDK 58 upgrade complete

The upgrade has landed: `expo ~58.0.25`, `react-native 0.88.1`, `react 19.3.1`, `expo-router ~58.0.31`, Reanimated 4.7.1 + Worklets 0.13, and all Expo modules are on SDK 58. The project typechecks, `expo-doctor` reports 20/20, the Android JS bundle exports successfully, and `expo prebuild --platform android` succeeds. Confirm the resolved config and package before building:

```sh
cd app
bun install
bunx expo config --json
bunx expo install --check
```

Check that the resolved config reports SDK 58 and that `android.package` is `com.unnamed0631.coolfitness`. Rebuild the development client from the final upgraded source; native code and JS must come from the same SDK generation. Do not reuse an older SDK 53 build, and do not build while the upgrade is mid-flight.

### 3.3 Build command

`app/eas.json` already has the right Android development profile:

```json
"development": {
  "developmentClient": true,
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  },
  "channel": "development"
}
```

Create the APK **before** starting the session; a build can take longer than a simulator session's maximum duration.

```sh
cd app
bunx eas-cli@latest build --platform android --profile development --non-interactive
```

The Android build must be an **`.apk`**. An `.aab` will not install on the emulator. The `development` profile above already sets `buildType: "apk"`.

The default remote Android image is `system-images;android-35;google_apis;x86_64`. The APK must include the **x86_64** architecture. Expo's default universal APK does; if you customize ABI splits, make sure `x86_64` is included.

### 3.4 Find the build ID

List finished Android builds:

```sh
cd app
bunx eas-cli@latest build:list --platform android --status finished --json --non-interactive
```

Pick the newest finished build created from the `development` profile and confirm it is the APK you want. Copy its **`id`** field; that is the `<BUILD_ID>` for `--build-id`.

Optional shell convenience (not an EAS flag): if `jq` is installed:

```sh
bunx eas-cli@latest build:list --platform android --status finished --json --non-interactive | jq -r '.[0].id'
```

Do not pass `--simulator` here; that flag is iOS-only.

### 3.5 Local archive options

There are two ways to use a local `.apk`:

**Option A: start a blank session, then install through the controller (documented):**

```sh
bunx eas-cli@latest simulator:start \
  --platform android \
  --type agent-device \
  --name "Local APK review" \
  --non-interactive

bunx eas-cli@latest simulator:exec \
  npx agent-device@latest install com.unnamed0631.coolfitness ./path/to/app-development.apk --platform android

bunx eas-cli@latest simulator:exec \
  npx agent-device@latest open com.unnamed0631.coolfitness --platform android
```

**Option B: pass a direct APK URL at session start:**

```sh
bunx eas-cli@latest simulator:start \
  --platform android \
  --type agent-device \
  --name "APK URL review" \
  --application-archive-url "https://example.com/app-development.apk" \
  --non-interactive
```

Use a URL that returns the APK file directly. `.aab` archives do not install. `--build-id`, `--build-fingerprint`, `--application-archive-url`, and `--expo-go` are mutually exclusive; pass at most one.

---

## 4. Start a session

### 4.1 Choose a session type

| `--type`           | Controller          | Use it for                                                                                                           |
| ------------------ | ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `agent-device`     | agent-device daemon | **Recommended here.** Accessibility-driven control, app installation, screenshots, recordings. This is the default.  |
| `argent`           | Argent tool server  | An agent that already uses Argent tools or its MCP server.                                                           |
| `appium`           | Appium server       | Existing Appium clients or test suites.                                                                              |
| `web-preview-only` | None                | Browser preview only; no programmatic controller. On Android, no idle timeout. Direct EAS CLI controls are iOS-only. |

Each session provisions **only** its own controller. agent-device commands do not work in an Argent session, and the session type cannot be changed after startup. For this runbook use `agent-device`.

### 4.2 Choose a device

Pass the Android hardware profile to `--device`. If omitted, the runner uses `medium_phone`.

| Profile ID       | Device                 |
| ---------------- | ---------------------- |
| `medium_phone`   | Medium Phone (default) |
| `pixel_9`        | Pixel 9                |
| `pixel_9_pro`    | Pixel 9 Pro            |
| `pixel_9_pro_xl` | Pixel 9 Pro XL         |
| `pixel_9a`       | Pixel 9a               |

Every profile uses a **720 x 1600** screen at density **300**; the profile selects the hardware definition, not the screen size. The default system image is Android API 35 with Google APIs (`system-images;android-35;google_apis;x86_64`).

To use a different Android system image, pass its full package name with `--system-image` (quote it because of the semicolons):

```sh
--device pixel_9 \
--system-image "system-images;android-35-ext15;google_apis_playstore;x86_64"
```

`--system-image` works only with `--platform android`. If the image is unavailable or incompatible with the runner, startup fails; omit the flag to use the default.

### 4.3 Duration, idle, and non-interactive behavior

- Maximum session duration: **40 minutes on Free**, **115 minutes on paid plans**.
- `--max-duration-minutes <N>` sets an automatic stop; `N` must be within the plan limit. Above the limit returns an error. If omitted, the session gets the plan maximum.
- `--max-idle-time-minutes <N>` stops after `N` minutes without session activity. It is supported for `agent-device`, `argent`, and `appium`; Android `web-preview-only` does not support it.
- Controller activity resets the idle timer. Watching the preview does **not** reset it. On Android, browser input does **not** reset it either.
- The session timer starts when the session is ready. The underlying job has a hard limit of the maximum duration plus five minutes.
- Sessions use account job concurrency. Queue time does not count toward the 15-minute startup timeout.
- **`--non-interactive` does not automatically stop the session.** The command returns when the session is ready; the remote device remains active and consumes usage until you stop it or it reaches its duration/idle limit. Closing the terminal or ending a CI job does not stop it either.
- `--json` implies non-interactive mode.
- Without `--non-interactive`, in an interactive terminal, EAS CLI stays attached. Press **Ctrl + C** once to stop the session and reset `.env.eas-simulator`.

### 4.4 Start command with a development build

With a fixed build and no Metro URL, the development client will show its launcher rather than your app. To load the app through Metro, pass the development-client URL with `--open-url` (requires an application source such as `--build-id`).

Start Metro **first** from `app/` so the tunnel URL exists before the session starts:

```sh
cd app
EXPO_UNSTABLE_TUNNEL_V2=1 npx expo start --tunnel
```

From SDK 58 onward, `npx expo start --tunnel` uses the signed tunnel by default and ignores `EXPO_UNSTABLE_TUNNEL_V2`; the variable is harmless and useful if you are still on an older SDK.

Then start the session (replace `<BUILD_ID>` and `<URL_ENCODED_METRO_URL>`):

```sh
cd app
bunx eas-cli@latest simulator:start \
  --platform android \
  --type agent-device \
  --name "SDK58 Android smoke test" \
  --build-id "<BUILD_ID>" \
  --device medium_phone \
  --max-duration-minutes 40 \
  --open-url "coolfitness://expo-development-client/?url=<URL_ENCODED_METRO_URL>" \
  --non-interactive
```

Notes:

- Use the `scheme` from `app/app.json` (`coolfitness`). URL-encode the full Metro URL when it contains a path or query.
- For Android, do **not** pass the `-EXDevMenu*` launch arguments; those are iOS-only.
- On SDK 58, you can optionally add `__expo_disable_onboarding=1`, `__expo_disable_fab=1`, and `__expo_disable_auto_launch=1` as query parameters on the development-client URL to control the dev menu behavior on both platforms.
- If you omit `--open-url`, the dev client opens its launcher. Use **Enter URL manually** in the launcher, or attach with a development-client URL through agent-device:

```sh
bunx eas-cli@latest simulator:exec \
  npx agent-device@latest open com.unnamed0631.coolfitness \
  "coolfitness://expo-development-client/?url=<URL_ENCODED_METRO_URL>" \
  --platform android --relaunch
```

- If you only need a fixed build and do not need Fast Refresh, the `preview` profile also builds an Android APK and embeds JavaScript at build time; skip Metro in that case. A release/preview build cannot be reconnected to Metro to enable Fast Refresh.

Optional idle guard (agent-device/argent/appium only):

```sh
--max-idle-time-minutes 15
```

Do not add `--max-idle-time-minutes` to an Android `web-preview-only` session; it is unsupported there.

### 4.5 Preview link visibility

By default, EAS CLI prints a private browser preview link that requires an Expo login with access to the project. Do not use `--public-link`: it embeds a preview token, anyone with the link can view the simulator, and on iOS can control it. Keep preview and `remoteConfig` values private.

---

## 5. Verify that the session is active

Use the session ID written to `.env.eas-simulator`:

```sh
cd app
bunx eas-cli@latest simulator:get --json --non-interactive
```

Continue only when **`status` is `IN_PROGRESS`** and **`remoteConfig` is present**. A stopped session can still leave old connection configuration behind, so the dotenv file alone is not proof that the device is live.

If you have more than one session, select explicitly:

```sh
bunx eas-cli@latest simulator:get --id "<SESSION_ID>" --json --non-interactive
```

Important fields:

- **`deviceRunSessionUrl`** — direct session page:
  ```text
  https://expo.dev/accounts/<account>/projects/<project>/simulator-sessions/<session-id>
  ```
- **`remoteConfig.webPreviewUrl`** — browser preview link (private by default; requires Expo login with project access).
- **`remoteConfig.previewUrl`** — the equivalent link for a `web-preview-only` session.
- **`remoteConfig`** — secret; it includes controller credentials. Do not print or share it.

The project-level session list is:

```text
https://expo.dev/accounts/<account>/projects/<project>/simulator-sessions
```

Open the preview in a desktop browser or use **Open preview** on the session page. The preview URL is a browser stream, **not an application deep link**; do not pass it to a controller command that opens apps or URLs.

Optional check for leftover sessions:

```sh
bunx eas-cli@latest simulator:list --status in-progress --json --non-interactive
```

---

## 6. Control the app

All controller commands go through `simulator:exec`, which loads the active session's connection details and then runs the command. There is no `simulator:tap` command.

### 6.1 agent-device (recommended)

The app identifier is `com.unnamed0631.coolfitness` from `app/app.json`. You can re-check the resolved value with `npx expo config --json` and the `android.package` field. A build can theoretically assign a different package; use the installed build's package if so.

```sh
mkdir -p artifacts

# List installed apps (add --all to include system apps).
bunx eas-cli@latest simulator:exec npx agent-device@latest apps --platform android

# Open the app.
bunx eas-cli@latest simulator:exec npx agent-device@latest open com.unnamed0631.coolfitness --platform android

# Read the interactive accessibility tree; refs look like @e1, @e2.
bunx eas-cli@latest simulator:exec npx agent-device@latest snapshot -i

# Press by ref or by label.
bunx eas-cli@latest simulator:exec npx agent-device@latest press @e2
bunx eas-cli@latest simulator:exec npx agent-device@latest press 'label="Continue"'

# Enter text, scroll, and perform a gesture.
bunx eas-cli@latest simulator:exec npx agent-device@latest fill @e4 "test@example.com"
bunx eas-cli@latest simulator:exec npx agent-device@latest scroll down
bunx eas-cli@latest simulator:exec npx agent-device@latest gesture swipe left

# Evidence.
bunx eas-cli@latest simulator:exec npx agent-device@latest screenshot ./artifacts/home.png
bunx eas-cli@latest simulator:exec npx agent-device@latest record start ./artifacts/flow.mp4
bunx eas-cli@latest simulator:exec npx agent-device@latest record stop

# Version-matched help for the installed controller.
bunx eas-cli@latest simulator:exec npx agent-device@latest help
bunx eas-cli@latest simulator:exec npx agent-device@latest help workflow
bunx eas-cli@latest simulator:exec npx agent-device@latest help debugging
```

Notes:

- A screenshot requires an open app session. If the session start command already launched the app, attach to it first. The docs show `open <app> --foreground` for attaching without a relaunch; that exact pattern is documented with `--platform ios`, so treat the Android `--foreground` combination as unverified and use a normal `open` if needed.
- In an Expo Simulators Android session, the emulator must be headless. Set `AGENT_DEVICE_HEADLESS=1` or pass `--headless` to `agent-device boot` if agent-device is the component booting the device. The session start command normally boots the session device already.
- If `record stop` times out while the remote device is still exporting, run `record stop` again. If agent-device cannot find the recording, add `--platform android`.

### 6.2 Argent

Argent is a controller from Software Mansion. Install its CLI globally, then run its tools through `simulator:exec`:

```sh
npm install --global @swmansion/argent

bunx eas-cli@latest simulator:exec argent run list-devices
bunx eas-cli@latest simulator:exec argent run screenshot --udid "<UDID>"
```

- Argent tools need an explicit `--udid`; use the booted device from `list-devices`.
- Argent gesture tools take coordinates from **0.0 to 1.0**, not pixels.
- For recordings, use Argent's `screen-recording-start` and `screen-recording-stop` tools. Argent removes unchanged frames by default, so disable that when measuring timing. Argent recordings on Expo Simulators include a watermark.
- To connect Argent's MCP server to the session, use the documented link form with `--yes` so a new token replaces an old one. Read the URL/token from the session environment; never print them:
  ```sh
  argent link '<TOOLS_URL>' --token '<TOKEN>' --yes
  ```
  Restart the editor if it already runs `argent mcp`.

### 6.3 Appium

Use `--type appium` when you already have an Appium suite. EAS CLI writes `APPIUM_URL` and `APPIUM_CAPS` for `simulator:exec`; run your Appium client through:

```sh
bunx eas-cli@latest simulator:exec <your-appium-client> [args...]
```

### 6.4 web-preview-only

This provisions no controller. Use the browser preview only. On Android, it does not support an idle timeout; use `--max-duration-minutes` to bound the session. Direct `eas simulator:control` actions are iOS-only and are not available for Android.

---

## 7. Evidence collection

Collect evidence only after the correct build is on screen and, for a development build, after it has connected to Metro. A preview/release build shows JavaScript from build time; editing source does not update it.

### 7.1 Screenshots and recordings

- agent-device: `screenshot ./artifacts/home.png`, `record start ./artifacts/flow.mp4`, `record stop` (commands in section 6.1).
- Argent: `argent run screenshot --udid <UDID>`; `screen-recording-start` / `screen-recording-stop`.
- Android sessions also produce a **session screen recording artifact** after the session stops. Find it on the expo.dev session page or in the `artifacts` array.
- `eas simulator:control screenshot.capture --output ./screen.png --id <SESSION_ID>` is **iOS-only**; do not use it for this Android runbook.

### 7.2 Session activity

Controller actions can be reviewed separately from app logs:

```sh
cd app
bunx eas-cli@latest simulator:events
bunx eas-cli@latest simulator:events --follow
bunx eas-cli@latest simulator:events --json
```

`--json` cannot be combined with `--follow`. `simulator:events` shows agent-device/Argent/Appium activity, not application runtime logs.

### 7.3 App logs

- `eas simulator:logs` is available for **iOS sessions only**. Android sessions do **not** provide logs through this command.
- For Android, use agent-device's `logs` command and its version-matched debugging help:
  ```sh
  bunx eas-cli@latest simulator:exec npx agent-device@latest help debugging
  ```
  Logging is off by default; open a focused log window for one reproduction instead of collecting unbounded logs.
- The expo.dev session page also has a **Logs** section for the job that ran the session. Job logs are available for 30 days after the session is created.

### 7.4 Session artifacts

Get the session with its artifacts:

```sh
bunx eas-cli@latest simulator:get --id "<SESSION_ID>" --json --non-interactive
```

Each artifact has `id`, `name`, `filename`, `metadata`, and `downloadUrl` (`fileSizeBytes` appears after the session stops). Download with:

```sh
curl --fail --location --max-time 600 --output ./capture.mp4 "<DOWNLOAD_URL>"
```

The `downloadUrl` is stable; each request redirects to a new signed URL valid for one hour. If a signed URL expires, request the same `downloadUrl` again. Artifacts can be downloaded after the session stops. People with project access can see the session page, and an artifact download link works without an Expo login, so share artifacts only with the intended audience.

---

## 8. Cleanup (mandatory)

`--non-interactive` does **not** stop the session. Always stop it explicitly:

```sh
cd app
bunx eas-cli@latest simulator:stop
```

Or stop a specific session:

```sh
bunx eas-cli@latest simulator:stop --id "<SESSION_ID>"
```

`--json` returns a machine-readable object with the session `id` and final `status`. Running `simulator:stop` on an already-stopped session succeeds.

Verify that nothing is left running:

```sh
bunx eas-cli@latest simulator:get --id "<SESSION_ID>" --json --non-interactive
bunx eas-cli@latest simulator:list \
  --status new \
  --status queued \
  --status starting \
  --status in-progress \
  --json --non-interactive
```

Also stop the Metro tunnel with **Ctrl + C** in its terminal. After stopping, EAS CLI resets `.env.eas-simulator` to only its comment header; leave the file gitignored and do not print it.

---

## Blocked here: account access

These are the exact checks run after the SDK 58 upgrade landed. Authentication succeeded, but the account does not have Expo Simulators access.

### 1. Authentication check

```sh
cd app
bunx eas-cli@latest whoami
```

Exact output (exit code 0):

```text
unnamed0631
tengisteka0631@gmail.com
```

### 2. Availability check

```sh
cd app
bunx eas-cli@latest simulator:availability --json
```

Exact output (exit code 0):

```json
{
  "available": false,
  "accountName": "unnamed0631",
  "billingUrl": "https://expo.dev/accounts/unnamed0631/settings/billing"
}
```

### What this means

- EAS CLI is authenticated as `unnamed0631`.
- Expo Simulators is a paid feature and is **not enabled** for this account, so `simulator:start` must not be called.
- No simulator session was started. No EAS build was started (a build would consume build credits and would not be usable remotely without Simulators access).
- Local validation already done: typecheck, `expo-doctor` 20/20, Android JS export, Android prebuild, server typecheck/build.

### Single next action

Enable Expo Simulators on the account (or switch to an account/plan that has it), then re-run:

```sh
cd app
bunx eas-cli@latest simulator:availability --json
```

Proceed only when `available` is `true`. Use the returned `billingUrl` to confirm the plan/access; do not start a session while it is `false`.

---

## Environment note: no local Android SDK

This Linux machine has no local Android runtime. Verified:

```sh
$ type adb emulator sdkmanager
sh: type: adb: not found
sh: type: emulator: not found
sh: type: sdkmanager: not found

$ printenv ANDROID_HOME ANDROID_SDK_ROOT
# (both unset; exit code 1)

$ ls -d /opt/android-sdk /usr/lib/android-sdk /home/unnamed/Android/Sdk
ls: cannot access '/opt/android-sdk': No such file or directory
ls: cannot access '/usr/lib/android-sdk': No such file or directory
ls: cannot access '/home/unnamed/Android/Sdk': No such file or directory
```

Therefore local `adb`, an Android emulator, `npx expo run:android`, and `eas build --local` are not options here. **Expo Simulators is the intended remote path.**

---

## Appendix: sources and flag notes

Documentation used (Markdown versions; the short `/install-app/`, `/devices/`, and `/cli-reference/` URLs return 404, so the actual paths below were used):

- [Introduction](https://docs.expo.dev/eas/simulators/introduction.md)
- [Get started](https://docs.expo.dev/eas/simulators/get-started.md)
- [Install your app](https://docs.expo.dev/eas/simulators/how-to/install-your-app.md)
- [Devices](https://docs.expo.dev/eas/simulators/reference/devices.md)
- [CLI reference](https://docs.expo.dev/eas/simulators/reference/cli.md)
- [Session types](https://docs.expo.dev/eas/simulators/reference/session-types.md)
- [Drive the device](https://docs.expo.dev/eas/simulators/how-to/drive-the-device.md)
- [Capture evidence](https://docs.expo.dev/eas/simulators/how-to/capture-evidence.md)
- [Iterate on your code (Metro/Fast Refresh)](https://docs.expo.dev/eas/simulators/how-to/iterate-on-your-code.md)
- [Expo Go on Expo Simulators](https://docs.expo.dev/eas/simulators/works-with/expo-go.md)
- [Usage and billing](https://docs.expo.dev/eas/simulators/reference/usage-and-billing.md)
- [Troubleshooting](https://docs.expo.dev/eas/simulators/troubleshooting.md)
- [Limitations](https://docs.expo.dev/eas/simulators/limitations.md)
- [agent-device](https://docs.expo.dev/agents/agent-device.md)
- [Argent](https://docs.expo.dev/agents/argent.md)

Flag notes:

- Every EAS flag used above appears in the fetched docs as of 2026-11-14.
- The hidden, experimental `--resource-class` flag is **not** used; the docs say it is not generally available.
- `--egress`, `--egress-allow`, `--network-capture`, `--frame-ancestor`, and `--cors-origin` are documented but are not needed for this basic Android test, so they are omitted.
- `jq` is optional shell tooling, not an EAS flag.
- The `--foreground` combination with `--platform android` is not explicitly shown in the fetched Android examples; it is marked unverified above. A plain `open ... --platform android` is the documented safe path.
