# Theming & colour system

The app used to mix `gray`/`slate`/`neutral`/`zinc` utilities, raw hex in icon
props, and per-screen `dark:` variants — 55+ files with three different
"secondary text" colours. This is the replacement: **one token file, semantic
Tailwind classes, automatic light/dark**.

## Architecture

```
theme/tokens.js            single source of truth (hex values, light + dark)
   ├─ tailwind.config.js   -> --color-* CSS variables (RGB triplets)
   │                          + semantic Tailwind colours
   └─ theme/index.ts       -> resolved hex map (`colors`) for icon props
                             (+ `themeVars` for web only)
        └─ lib/theme.tsx   -> ThemeProvider applies the scheme, useAppTheme()
```

- Values are emitted as **RGB triplets** (`255 255 255`) so opacity modifiers
  work: `bg-primary/10` → `rgb(var(--color-primary) / 0.1)`.
- **Native:** the variables are compiled as light/dark _pairs_ on `:root` and
  switch through `colorScheme.set()` → `Appearance.setColorScheme()`. No
  component ever changes shape when the theme changes.
- **Web:** react-native-web has no `Appearance.setColorScheme`, so the
  `.dark` class plus NativeWind's `vars()` are applied instead; both are
  scoped to `Platform.OS === "web"` in `lib/theme.tsx`.

> ⚠️ **Never add CSS variables to a component after its first render** on
> native (`vars()` in a `style` that appears later, or toggling a class whose
> rule defines variables). `react-native-css-interop` then prints an upgrade
> warning, remounts the subtree — losing navigation state — and can crash while
> serialising props (`Couldn't find a LinkingContext context`). Variables must
> be static; switch them via the appearance pair instead.

## Tokens

| Token                | Light     | Dark      | Use for                       |
| -------------------- | --------- | --------- | ----------------------------- |
| `background`         | `#FFFFFF` | `#0B1120` | screen canvas                 |
| `foreground`         | `#0F172A` | `#F1F5F9` | primary text                  |
| `card`               | `#FFFFFF` | `#111827` | cards, rows, sheets           |
| `card-foreground`    | `#0F172A` | `#F1F5F9` | text on cards                 |
| `muted`              | `#F1F5F9` | `#1E293B` | chips, insets, dividers       |
| `muted-foreground`   | `#475569` | `#94A3B8` | secondary text                |
| `subtle`             | `#64748B` | `#94A3B8` | captions, hints               |
| `border`             | `#E2E8F0` | `#1E293B` | hairlines                     |
| `primary`            | `#136CF1` | `#4C91F9` | brand button, active state    |
| `primary-foreground` | `#FFFFFF` | `#FFFFFF` | text on `primary`             |
| `primary-soft`       | `#E8F1FE` | `#16263D` | brand tinted surfaces         |
| `accent`             | `#E9509F` | `#F472B6` | likes / highlights            |
| `success`            | `#16A34A` | `#22C55E` | completed state               |
| `warning`            | `#D97706` | `#F59E0B` | caution                       |
| `destructive`        | `#DC2626` | `#F87171` | destructive action            |
| `overlay`            | `#000000` | `#000000` | modal scrim (`bg-overlay/50`) |

Every token generates `bg-`, `text-`, `border-`, `fill-`, `stroke-` utilities
with opacity support.

## Usage

```tsx
// surfaces + text + borders
<View className="bg-card border border-border rounded-card p-4">
  <Text className="text-foreground text-lg font-bold">Title</Text>
  <Text className="text-muted-foreground">Secondary copy</Text>
  <Text className="text-subtle text-xs">Updated 2 min ago</Text>
</View>

// brand
<Pressable className="bg-primary rounded-full px-6 py-3">
  <Text className="text-primary-foreground font-semibold">Start</Text>
</Pressable>

// tinted
<View className="bg-primary/10 rounded-xl px-3 py-2">
  <Text className="text-primary text-sm">Boost with AI</Text>
</View>
```

### Primitives (prefer these)

```tsx
import { ThemeText, ThemeView } from "@/components";

<ThemeView surface="background" className="px-6">
  <ThemeText variant="default">Primary</ThemeText>
  <ThemeText variant="muted">Secondary</ThemeText>
  <ThemeText variant="subtle">Caption</ThemeText>
  <ThemeText variant="primary">Brand</ThemeText>
  <ThemeText variant="destructive">Delete</ThemeText>
</ThemeView>;
```

`ThemeView` also accepts `surface="card" | "muted" | "none"`.
`FonttoiText` takes the same `variant` prop. Radii: `rounded-card` (26px) and
`rounded-sheet` (32px).

#### How `ThemeText` picks a colour

`ThemeText` applies its variant class **unless** the caller passed a real text
colour:

```ts
hasExplicitTextColor("text-xl font-semibold"); // false -> adds text-foreground
hasExplicitTextColor("text-xl text-primary"); // true  -> keeps text-primary
hasExplicitTextColor("text-2xl text-center"); // false -> adds text-foreground
```

Size and alignment utilities (`text-lg`, `text-2xl`, `text-center`,
`text-ellipsis`, `text-[10px]`) are **not** colours. The matcher only accepts
semantic tokens, palette shades (`gray-500`…`rose-700`), and arbitrary colour
values (`text-[#fff]`, `text-[rgb(...)]`). Keep it strict: a false positive
silently drops `text-foreground`, which renders **black text in dark mode**.

If you use a raw `<Text>` instead of `ThemeText`, you must set a colour class
(`text-foreground`, `text-subtle`, …) — React Native's default is black.

### Colours in props (icons, placeholders, `RefreshControl`)

Props cannot take a `className`, so use the resolved hex map:

```tsx
const { colors } = useAppTheme();

<Icon source="bell" color={colors.foreground} />
<Heart color={isLiked ? colors.accent : colors.mutedForeground} />
<TextInput placeholderTextColor={colors.subtle} />
```

Available keys mirror the token list, camelCased: `colors.background`,
`colors.foreground`, `colors.card`, `colors.mutedForeground`, `colors.subtle`,
`colors.border`, `colors.primary`, `colors.primaryForeground`,
`colors.primarySoft`, `colors.accent`, `colors.success`, `colors.warning`,
`colors.destructive`, `colors.overlay`.

## Rules

1. **Never** write `text-gray-500`, `bg-white`, `dark:bg-gray-900` or a raw hex
   in a new component. Use a token.
2. **Never** add `dark:` variants for colours — tokens already adapt.
3. **Decorative assets opt out.** Things drawn on top of fixed imagery or with
   an intentional palette keep their own colours:
   - `components/home/FortuneCookie.tsx` (amber)
   - `components/home/WaterAnimation.tsx` (wave gradients)
   - `components/home/Training.tsx` (light `gradient.png` card → fixed dark ink)
   - `app/home/training/index.tsx` highlight card (translucent blue + white chips)
   - `app/home/training/screen1.tsx` hero over `lightEffect.jpg`
   - `app/Streak.tsx` achievement cards (yellow/green meaning)
   - `components/cameraTracking.tsx` (status panel tuned to the camera feed)
4. Status colours carry meaning: `success` for done, `warning` for caution,
   `destructive` only for actions that destroy data — not for a liked heart.
5. **Never use a size/alignment utility as a colour.** `text-lg` does not make
   text readable in dark mode; wrap text in `ThemeText` or add a colour class.

## Gotchas (both cost a debugging session)

**1. Black text in dark mode.** If `ThemeText` thinks the caller supplied a
colour it skips `text-foreground`. A naive check like
`/(text|color)-\S+/` matches `text-2xl` and breaks every heading in dark mode
while looking perfect in light mode. Use `hasExplicitTextColor()`.

**2. `Couldn't find a LinkingContext context.`** Thrown from
`react-native-css-interop`'s upgrade-warning serialiser, not from navigation.
It means a component gained CSS variables after its first render (e.g. a
`.dark` class applied once the stored theme hydrates). Native must use the
compiled light/dark variable _pairs_; `vars()` and variable-bearing classes are
web-only. Never introduce variables mid-lifecycle.

## Dark-mode testing checklist

1. Settings → Dark Mode (or set the OS to dark) and open each screen.
2. Check for **black-on-dark** text (missing colour class) and
   **light-on-light** text over fixed imagery (decorative cards).
3. Check icons and placeholders — they use `colors.*`, not classes, so they
   can disagree with text when one path is wrong.
4. Toggle the theme _while on a screen_ — the screen must not remount or lose
   navigation state.

## Adding a token

1. Add the key to **both** `themes.light` and `themes.dark` in
   `theme/tokens.js` (same key set in both).
2. Add it to the `ThemeColors` interface in `theme/tokens.d.ts`.
3. Use it as `bg-<token>` / `text-<token>` — no other file needs editing.

## Verifying

```bash
cd app
bun run typecheck
bun run lint

# 1. no raw neutral utilities left (exit code 1 / empty = good)
grep -rnE "text-(gray|slate|neutral|zinc)-[0-9]|dark:(text|bg|border)-" \
  --include=*.tsx app components

# 2. native: tokens must be light/dark PAIRS on the root, with no class-scoped
#    variable rules. Start Metro and grep the dev bundle:
bunx expo start --port 8082
curl -s "http://127.0.0.1:8082/node_modules/expo-router/entry.bundle?platform=android&dev=true" \
  | grep -o 'rootVariables:{"--color-background":{[^}]*}'
# expect: rootVariables:{"--color-background":{light:[255,255,255],dark:[11,17,32]}

# 3. web: readable CSS with :root + a dark block/branch
bunx expo export --platform web --output-dir /tmp/exp-web
grep -oE -- "--color-[a-z-]+:[^;}]*" /tmp/exp-web/client/_expo/static/css/*.css | head
```

The only legitimate raw colours left in app code are the decorative exceptions
listed under **Rules → 3** (plus `bg-black` video letterboxing in
`WorkoutModal` and the camera-overlay `StyleSheet` in `cameraTracking.tsx`).
