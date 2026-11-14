export type ThemeName = "light" | "dark";

export interface ThemeColors {
  background: string;
  foreground: string;

  card: string;
  cardForeground: string;

  muted: string;
  mutedForeground: string;
  subtle: string;

  border: string;

  primary: string;
  primaryForeground: string;
  primarySoft: string;

  accent: string;

  success: string;
  warning: string;
  destructive: string;

  overlay: string;
}

export declare const themes: Record<ThemeName, ThemeColors>;
export declare function toKebab(value: string): string;
export declare function toRgbTriplet(hex: string): string;
