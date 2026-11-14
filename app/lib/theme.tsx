import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, useColorScheme, View } from "react-native";
import { colorScheme } from "nativewind";
import { themeColors, themeVars } from "@/theme";
import type { ThemeColors, ThemeName } from "@/theme";

const THEME_KEY = "app-theme";
const isWeb = Platform.OS === "web";

type Theme = ThemeName;
type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** Resolved hex values for the current mode (for non-className props). */
  colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  colors: themeColors.light,
});

/**
 * Provides the active colour scheme.
 *
 * Colours are static CSS variables compiled from `theme/tokens.js`:
 *   - native: `:root` variables with light/dark pairs -> switched by
 *     `colorScheme.set()` (which drives `Appearance`). Nothing about a
 *     component changes shape mid-lifecycle, so css-interop never remounts.
 *   - web:    the `.dark` class + `vars()` style, because react-native-web has
 *     no `Appearance.setColorScheme`.
 *
 * Do not add NativeWind variables to a component after its first render: that
 * makes react-native-css-interop print an upgrade warning and remount the
 * subtree (which is what used to crash here while serialising props).
 */
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const system = useColorScheme();
  const [theme, setThemeState] = useState<Theme>("light");

  // Initialize theme from storage or system
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_KEY);
        const initialTheme = (stored as Theme) || (system as Theme) || "light";
        setThemeState(initialTheme);
        colorScheme.set(initialTheme);
      } catch (error) {
        console.error("Error initializing theme:", error);
      }
    };

    initializeTheme();
  }, [system]);

  const setTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem(THEME_KEY, newTheme);
      setThemeState(newTheme);
      colorScheme.set(newTheme);
    } catch (error) {
      console.error("Error setting theme:", error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, colors: themeColors[theme] }}
    >
      <View
        className={`flex-1 ${isWeb ? theme : ""}`}
        style={isWeb ? themeVars[theme] : undefined}
      >
        {children}
      </View>
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
