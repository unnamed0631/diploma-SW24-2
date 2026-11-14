import { Text, Pressable } from "react-native";
import { ThemeView, ThemeText } from "@/components";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useTranslation } from "@/lib/language";

export default function ProfileLogin() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <ThemeView className="flex-1 items-center justify-center">
      <Image
        source={require("@/assets/img/logo.png")}
        style={{ width: 100, height: 100, marginBottom: 10 }}
      />

      <ThemeText className="text-xl text-center text-foreground font-semibold">
        {t("Login")}
      </ThemeText>

      <Pressable
        onPress={() => router.push("/(auth)/Language")}
        className="bg-primary px-6 py-2 rounded-full mt-6"
      >
        <Text className="text-primary-foreground text-base font-medium">
          {t("login.button1")}
        </Text>
      </Pressable>
    </ThemeView>
  );
}
