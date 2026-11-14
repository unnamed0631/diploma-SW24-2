import { Stack } from "expo-router";

export default function TrainingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" options={{ animation: "fade" }} />
      <Stack.Screen name="screen1" />
      <Stack.Screen name="screen2" />
      <Stack.Screen name="start" options={{ animation: "fade" }} />
      <Stack.Screen name="test" options={{ animation: "fade" }} />
    </Stack>
  );
}
