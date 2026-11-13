import { Stack } from "expo-router";

export const unstable_settings = {
  anchor: "welcome",
};

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="ForgotPassword" />
      <Stack.Screen name="register" />
      <Stack.Screen name="otp-verification" />
      <Stack.Screen name="VerificationSuccess" />
      <Stack.Screen name="EmailRegister" />
      {/* <Stack.Screen name="EmailVerification" /> */}
    </Stack>
  );
}
