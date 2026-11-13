import { ThemeView, Providers } from "@/components";
import { Platform } from "react-native";
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
// import * as NavigationBar from "expo-navigation-bar";
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

const RootLayout = () => {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const [loaded, error] = useFonts({
    Quicksand: require("../assets/fonts/Quicksand-Variable.ttf"),
  });
  const [skiaReady, setSkiaReady] = useState(Platform.OS !== "web");

  // useEffect(() => {
  //   const setNavigationBar = async () => {
  //     if (Platform.OS === "android") {
  //       await NavigationBar.setVisibilityAsync("hidden");
  //     }
  //   };
  //   setNavigationBar();
  // }, []);

  useEffect(() => {
    useStatsStore?.getState()?.load();
    useDailyTaskStore?.getState()?.initializeTasks(t);
  }, [t]);

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
      <ThemeView>
        {/* <SafeAreaView className={`flex-1`}> */}
        <ThemeProvider>
          <Providers>
            <StatusBar
              style={theme === "dark" ? "light" : "dark"}
              hidden={true}
            />

            {/* <View className="flex flex-row w-full justify-between">
              <ThemeSwitch />
              <LangSwitch />
            </View> */}
            <Stack
              screenOptions={{
                headerShown: false,
                presentation: Platform.OS === "ios" ? "modal" : "card",
                animation: Platform.OS === "ios" ? "default" : "ios_from_right",
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
        </ThemeProvider>
        {/* </SafeAreaView> */}
      </ThemeView>
    </GestureHandlerRootView>
  );
};

export default RootLayout;
