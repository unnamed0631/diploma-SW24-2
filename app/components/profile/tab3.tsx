import { ScrollView, View } from "react-native";
import { Icon } from "react-native-paper";
import { ThemeText } from "@/components";
import { useAppTheme } from "@/lib/theme";

export default function Tab3() {
  const { colors } = useAppTheme();

  return (
    <ScrollView className="p-4">
      <View className="bg-card rounded-2xl p-6 shadow-sm mt-8 items-center">
        <Icon
          source="account-group-outline"
          size={44}
          color={colors.foreground}
        />
        <ThemeText className="text-xl font-bold mt-4 text-center">
          Duels are coming soon
        </ThemeText>
        <ThemeText className="text-sm text-subtle mt-2 text-center">
          Duels need a friends and challenges model, which isn&apos;t available
          yet. Once it is, you&apos;ll be able to compare progress with friends
          here.
        </ThemeText>
      </View>
    </ScrollView>
  );
}
