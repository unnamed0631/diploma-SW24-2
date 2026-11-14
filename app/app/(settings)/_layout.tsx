import { Stack } from "expo-router";

export const unstable_settings = {
  anchor: "settings",
};

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="settings" />
      <Stack.Screen name="Edit" />
      <Stack.Screen name="Notifications" />
      <Stack.Screen name="CloseFriends" />
      <Stack.Screen name="Privacy" />
    </Stack>
  );
}
