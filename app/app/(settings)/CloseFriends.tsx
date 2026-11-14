import { useNavigation, useRouter } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";
import { Icon } from "react-native-paper";
import { ThemeText, ThemeView } from "@/components";
import { useTranslation } from "@/lib/language";
import { useAppTheme } from "@/lib/theme";

export default function CloseFriends() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.push("/");
    }
  };

  return (
    <ThemeView className="pt-8 px-10 flex-1">
      <View className="flex-row items-center justify-between w-full">
        <View className="border-2 overflow-hidden border-border rounded-full">
          <Pressable
            android_disableSound
            android_ripple={{
              color: colors.subtle,
              radius: 20,
            }}
            className="p-2"
            onPress={handleBack}
          >
            <Icon source="chevron-left" size={25} color={colors.foreground} />
          </Pressable>
        </View>
        <ThemeText className="text-2xl text-center font-semibold absolute left-1/2 -translate-x-1/2">
          {t("closeFriends.title")}
        </ThemeText>
      </View>

      <View className="flex-1 items-center justify-center px-4 pb-20">
        <View className="bg-primary-soft p-6 rounded-full">
          <Icon
            source="account-group-outline"
            size={48}
            color={colors.foreground}
          />
        </View>
        <ThemeText className="text-xl font-semibold mt-6 text-center">
          {t("closeFriends.heading")}
        </ThemeText>
        <ThemeText className="text-base mt-4 text-center text-subtle">
          {t("closeFriends.body")}
        </ThemeText>
        <ThemeText className="text-sm mt-6 text-center text-subtle">
          {t("closeFriends.hint")}
        </ThemeText>
      </View>
    </ThemeView>
  );
}
