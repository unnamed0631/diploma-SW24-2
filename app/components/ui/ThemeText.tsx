import { Text } from "react-native";
import type { ComponentProps, ReactNode } from "react";

/**
 * Semantic text colours. Prefer these over raw `text-gray-*` classes so a
 * screen automatically adapts to light/dark mode.
 *
 *   default - primary copy            text-foreground
 *   muted   - secondary copy          text-muted-foreground
 *   subtle  - captions and hints      text-subtle
 *   inverse - text on brand surfaces  text-primary-foreground
 *   primary - brand emphasis          text-primary
 *   accent  - highlight emphasis      text-accent
 */
export type ThemeTextVariant =
  | "default"
  | "muted"
  | "subtle"
  | "inverse"
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "destructive";

// Classes must stay statically analysable for Tailwind's content scanner.
export const themeTextClasses = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  subtle: "text-subtle",
  inverse: "text-primary-foreground",
  primary: "text-primary",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
} as const satisfies Record<ThemeTextVariant, string>;

const COLOR_UTILITIES = [
  // semantic tokens
  "foreground",
  "muted-foreground",
  "subtle",
  "primary",
  "primary-foreground",
  "primary-soft",
  "accent",
  "success",
  "warning",
  "destructive",
  "card-foreground",
  "background",
  "card",
  "muted",
  "border",
  "overlay",
  // keywords / defaults
  "white",
  "black",
  "transparent",
  "current",
  "inherit",
] as const;

const PALETTES =
  "gray|slate|neutral|zinc|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";

/**
 * True when `className` sets an actual text colour (and therefore should win
 * over the variant default).
 *
 * Deliberately does NOT match size/alignment utilities: `text-lg`, `text-2xl`,
 * `text-center` and `text-ellipsis` are not colours. Getting this wrong
 * silently drops `text-foreground`, which renders black text in dark mode.
 */
export function hasExplicitTextColor(className?: string | null): boolean {
  if (!className) return false;

  return className
    .split(/\s+/)
    .filter(Boolean)
    .some((token) => {
      const base = token.replace(/^[a-z-]+:/, ""); // strip variants (dark:, active:, ...)
      if (!base.startsWith("text-")) return false;

      const value = base.slice("text-".length).replace(/\/\d+$/, "");
      if (!value) return false;

      if ((COLOR_UTILITIES as readonly string[]).includes(value)) return true;
      if (new RegExp(`^(?:${PALETTES})-\\d{2,3}$`).test(value)) return true;
      // arbitrary values: text-[#fff], text-[rgb(...)], text-[hsl(...)]
      if (/^\[(#|rgb|hsl)/.test(value)) return true;
      return false;
    });
}

export interface ThemeTextProps extends ComponentProps<typeof Text> {
  children: ReactNode;
  className?: string;
  variant?: ThemeTextVariant;
}

const ThemeText = ({
  children,
  className,
  variant = "default",
  ...props
}: ThemeTextProps) => {
  const classname = hasExplicitTextColor(className)
    ? (className as string)
    : `${themeTextClasses[variant]} ${className ?? ""}`;

  return (
    <Text {...props} className={classname.trim()}>
      {children}
    </Text>
  );
};

export default ThemeText;
