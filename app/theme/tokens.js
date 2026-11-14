/**
 * SOURCE for the app's color system.
 *
 * Both consumers read these hex values:
 *   1. `tailwind.config.js`  -> converts them to `--color-*` CSS variables
 *                               (as RGB triplets, so `bg-primary/40` works)
 *   2. `theme/index.ts`      -> applies them with NativeWind's `vars()` and
 *                               exposes resolved hex values for icon props.
 *
 * Add a token here once and it is available everywhere as a Tailwind class
 * (`bg-<token>`, `text-<token>`, `border-<token>`, ...).
 *
 * Naming follows the shadcn/ui convention so it reads like modern Tailwind:
 *   background / foreground        - app canvas + default text
 *   card / cardForeground          - raised surfaces
 *   muted / mutedForeground        - subtle fills + secondary text
 *   subtle                         - tertiary text (captions, hints)
 *   border                         - hairlines
 *   primary (+Foreground, Soft)    - brand blue
 *   accent                         - highlight pink
 *   success / warning / destructive
 *   overlay                        - modal scrims
 *
 * Keep `themes.light` and `themes.dark` in sync: both must expose the same keys.
 */

const themes = {
  light: {
    background: "#FFFFFF",
    foreground: "#0F172A",

    card: "#FFFFFF",
    cardForeground: "#0F172A",

    muted: "#F1F5F9",
    mutedForeground: "#475569",
    subtle: "#64748B",

    border: "#E2E8F0",

    primary: "#136CF1",
    primaryForeground: "#FFFFFF",
    primarySoft: "#E8F1FE",

    accent: "#E9509F",

    success: "#16A34A",
    warning: "#D97706",
    destructive: "#DC2626",

    overlay: "#000000",
  },
  dark: {
    background: "#0B1120",
    foreground: "#F1F5F9",

    card: "#111827",
    cardForeground: "#F1F5F9",

    muted: "#1E293B",
    mutedForeground: "#94A3B8",
    subtle: "#94A3B8",

    border: "#1E293B",

    primary: "#4C91F9",
    primaryForeground: "#FFFFFF",
    primarySoft: "#16263D",

    accent: "#F472B6",

    success: "#22C55E",
    warning: "#F59E0B",
    destructive: "#F87171",

    overlay: "#000000",
  },
};

/** camelCase token -> kebab-case CSS variable / class suffix. */
const toKebab = (value) =>
  value.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** `#RRGGBB` -> `"R G B"` so Tailwind can do `rgb(var(--x) / <alpha>)`. */
const toRgbTriplet = (hex) => {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const int = parseInt(full, 16);
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`;
};

module.exports = { themes, toKebab, toRgbTriplet };
