/** @type {import('tailwindcss').Config} */
const { fontFamily } = require("tailwindcss/defaultTheme");
const { themes, toKebab, toRgbTriplet } = require("./theme/tokens.js");

/**
 * Semantic colour tokens live in `theme/tokens.js`.
 *
 * Each token becomes a Tailwind colour backed by a CSS variable, so a single
 * class adapts to light/dark mode:
 *
 *   <Text className="text-muted-foreground">   secondary copy
 *   <View className="bg-card border-border">   raised surface
 *   <Pressable className="bg-primary">         brand button
 *
 * Opacity modifiers work too: `bg-primary/10`, `text-foreground/60`.
 */
const semanticColors = Object.fromEntries(
  Object.keys(themes.light).map((token) => {
    const name = toKebab(token);
    return [name, `rgb(var(--color-${name}) / <alpha-value>)`];
  }),
);

const cssVariables = (mode) =>
  Object.fromEntries(
    Object.entries(themes[mode]).map(([token, hex]) => [
      `--color-${toKebab(token)}`,
      toRgbTriplet(hex),
    ]),
  );

module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ...semanticColors,
      },
      fontFamily: {
        quicksand: ["Quicksand", ...fontFamily.sans],
      },
      borderRadius: {
        card: "26px",
        sheet: "32px",
      },
      borderColor: {
        DEFAULT: semanticColors.border,
      },
    },
  },
  plugins: [
    // Semantic variables are registered as light/dark *pairs* on the root via a
    // media query, which is what native needs: a class-scoped override that a
    // component only gains after its first render (e.g. `.dark` applied once the
    // stored theme hydrates) makes react-native-css-interop warn and remount the
    // subtree. Pairs switch purely through `Appearance`/`colorScheme.set()`.
    //
    // The `.dark` block is kept for web, where NativeWind toggles a class instead
    // of Appearance; the app only applies it on web (see lib/theme.tsx).
    ({ addBase }) =>
      addBase({
        ":root": cssVariables("light"),
        ".dark": cssVariables("dark"),
        "@media (prefers-color-scheme: dark)": {
          ":root": cssVariables("dark"),
        },
      }),
  ],
};
