import React from "react";
import { View, Text } from "react-native";
import { Users } from "lucide-react-native";
import { useTranslation } from "@/lib/language";
import { useAppTheme } from "@/lib/theme";

export default function FriendsActivity() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <View className="mt-8">
      <Text className="text-lg font-semibold text-foreground mb-4">
        {t("friendsActivity.title")}
      </Text>
      <View className="items-center justify-center bg-card rounded-3xl px-6 py-8 border border-dashed border-border">
        <Users size={32} color={colors.subtle} />
        <Text className="mt-3 text-sm text-center text-subtle">
          Friends and challenges are coming soon
        </Text>
      </View>
    </View>
  );
}
