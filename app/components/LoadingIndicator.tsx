import { View, ActivityIndicator } from "react-native";
import { useAppTheme } from "@/lib/theme";

export default function LoadingIndicator() {
  const { colors } = useAppTheme();

  return (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
