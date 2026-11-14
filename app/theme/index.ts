import { vars } from "nativewind";
import { themes, toKebab, toRgbTriplet } from "./tokens";
import type { ThemeColors, ThemeName } from "./tokens";

export type { ThemeColors, ThemeName };
export { themes, toKebab };

/** Resolved hex values, for props that cannot take a className (e.g. icons). */
export const themeColors: Record<ThemeName, ThemeColors> = themes;

const toVariables = (mode: ThemeName) =>
  Object.fromEntries(
    Object.entries(themes[mode]).map(([token, hex]) => [
      `--color-${toKebab(token)}`,
      toRgbTriplet(hex),
    ]),
  ) as Record<`--${string}`, string>;

/**
 * Web-only: react-native-web has no `Appearance.setColorScheme`, so NativeWind
 * switches themes by toggling a class. Applying the variables as a style keeps
 * the two platforms independent.
 *
 * Do NOT use this on native — variables that appear after a component's first
 * render make react-native-css-interop remount the subtree. Native uses the
 * paired `:root` variables compiled by `tailwind.config.js` instead.
 */
export const themeVars: Record<ThemeName, Record<`--${string}`, string>> = {
  light: vars(toVariables("light")),
  dark: vars(toVariables("dark")),
};
