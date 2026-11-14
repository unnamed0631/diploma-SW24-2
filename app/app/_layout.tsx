import { ThemeView, Providers } from "@/components";
import { Platform, View } from "react-native";
import { ThemeProvider, useAppTheme } from "@/lib/theme";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router/stack";
import "@/lib/global.css";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useStatsStore } from "@/stores/statsStore";
import useDailyTaskStore from "@/stores/dailyTaskStore";
import { useTranslation } from "@/lib/language";
import { loadSkia } from "@/lib/loadSkia";

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 400, fade: true });

export const unstable_settings = {
  anchor: "(tabs)",
};

/**
 * Rendered inside `ThemeProvider` so `useAppTheme()` returns the real theme
 * (status bar style, backgrounds) instead of the context default.
 */
const ThemedApp = () => {
  const { theme, colors } = useAppTheme();
  const { t } = useTranslation();

  useEffect(() => {
    useStatsStore?.getState()?.load();
    useDailyTaskStore?.getState()?.initializeTasks(t);
  }, [t]);

  return (
    <ThemeView className="flex-1">
      <Providers>
        <StatusBar style={theme === "dark" ? "light" : "dark"} hidden={true} />

        <Stack
          screenOptions={{
            headerShown: false,
            presentation: Platform.OS === "ios" ? "modal" : "card",
            animation: Platform.OS === "ios" ? "default" : "ios_from_right",
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{ animation: "default", presentation: "card" }}
          />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(meal)" />
          <Stack.Screen
            name="home"
            options={{ animation: "default", presentation: "card" }}
          />
          <Stack.Screen name="chatbot" />
          <Stack.Screen
            name="mnkv"
            options={{ animation: "default", presentation: "card" }}
          />
        </Stack>
      </Providers>
    </ThemeView>
  );
};

const RootLayout = () => {
  const [loaded, error] = useFonts({
    Quicksand: require("../assets/fonts/Quicksand-Variable.ttf"),
  });
  const [skiaReady, setSkiaReady] = useState(Platform.OS !== "web");

  useEffect(() => {
    if (Platform.OS !== "web") return;

    loadSkia()
      .catch((skiaError) =>
        console.error("Failed to load Skia on web:", skiaError),
      )
      .finally(() => setSkiaReady(true));
  }, []);

  useEffect(() => {
    if ((loaded || error) && skiaReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, skiaReady]);

  if (!loaded || !skiaReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* ThemeProvider is the outermost layer so the semantic colour variables
          are available to every screen, modal and portal below it. */}
      <ThemeProvider>
        <View className="flex-1">
          <ThemedApp />
        </View>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;
