import { ThemeView } from "@/components";
import { useAppTheme } from "@/lib/theme";
import { Stack } from "expo-router";

export default function TabLayout() {
  const { colors } = useAppTheme();

  return (
    <ThemeView>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="training" />
      </Stack>
    </ThemeView>
  );
}
