import React from "react";
import { View, Pressable } from "react-native";
import { Icon } from "react-native-paper";
import { ThemeText } from "@/components";
import { useAppTheme } from "@/lib/theme";

interface SettingsItemProps {
  icon: string;
  title: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

export function SettingsItem({
  icon,
  title,
  onPress,
  rightElement,
  showChevron = true,
}: SettingsItemProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      className="flex-row mt-8 items-center justify-between"
      onPress={onPress}
    >
      <View className="flex-row items-center gap-8">
        <View className="bg-primary-soft p-4 rounded-full">
          <Icon source={icon} size={25} color={colors.foreground} />
        </View>
        <ThemeText className="text-xl font-semibold">{title}</ThemeText>
      </View>
      {rightElement ||
        (showChevron && (
          <Icon source="chevron-right" size={25} color={colors.foreground} />
        ))}
    </Pressable>
  );
}
