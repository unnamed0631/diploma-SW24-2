import { Stack } from "expo-router/stack";

export const unstable_settings = {
  anchor: "asuult",
};

export default function MealLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "modal",
        animation: "flip",
      }}
    >
      <Stack.Screen name="asuult2" />
      <Stack.Screen name="asuult3" />
      <Stack.Screen name="asuult4" />
      <Stack.Screen name="asuult5" />
      <Stack.Screen name="nemeh" />
    </Stack>
  );
}
