import React from "react";
import { View, Text, Pressable } from "react-native";
import { ThemeView } from "@/components";
import Camera from "@/components/cameraTracking";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useTranslation } from "@/lib/language";
import { useAppTheme } from "@/lib/theme";

export default function Test() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <ThemeView className="flex-1">
      <View
        className="flex-row items-center justify-between px-6 pb-3"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Text className="flex-1 text-lg font-bold text-foreground">
          {t("training.measure")}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="p-3 rounded-2xl bg-muted ml-4"
        >
          <X size={20} color={colors.foreground} />
        </Pressable>
      </View>
      <View className="flex-1">
        <Camera />
      </View>
    </ThemeView>
  );
}
