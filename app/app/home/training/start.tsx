import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { ThemeView, ThemeText } from "@/components";
import { Image } from "expo-image";
import { useTranslation } from "@/lib/language";
import { Button } from "react-native-paper";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/lib/theme";

export default function Start() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <ThemeView className="p-8" style={{ paddingTop: insets.top + 32 }}>
      <View className="flex-row items-center justify-between">
        <ThemeText className="text-2xl font-bold">
          {t("training.workout")}
        </ThemeText>
        <Pressable
          onPress={() => router.back()}
          className="p-3 rounded-2xl bg-muted"
        >
          <X size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <View className="w-full h-[45%] bg-muted rounded-3xl mt-4">
        <Image
          source={require("@/assets/beetch.png")}
          style={[
            StyleSheet.absoluteFill,
            { width: "100%", height: "100%", borderRadius: 20 },
          ]}
          cachePolicy={"memory-disk"}
          contentFit={"cover"}
          focusable={false}
        />
      </View>
      <ThemeText className="font-bold text-4xl mt-5 w-[80%]">
        {t("training.measure")}
      </ThemeText>
      <ThemeText className="mt-5 text-xl">{t("training.test")}</ThemeText>
      <View className="absolute bottom-5 left-5 right-5">
        <Pressable onPress={() => router.push("/home/training/screen2")}>
          <Button
            mode="contained"
            className="rounded-xl"
            contentStyle={{ paddingVertical: 12, backgroundColor: colors.card }}
          >
            <Text className="text-card-foreground font-bold">
              {t("start.later")}
            </Text>
          </Button>
        </Pressable>
      </View>
      <View className="absolute bottom-28 left-5 right-5">
        <Pressable onPress={() => router.push("/home/training/test")}>
          <Button
            mode="contained"
            className="rounded-xl"
            textColor={colors.background}
            contentStyle={{
              paddingVertical: 12,
              backgroundColor: colors.foreground,
            }}
          >
            {t("start.start")}
          </Button>
        </Pressable>
      </View>
    </ThemeView>
  );
}
