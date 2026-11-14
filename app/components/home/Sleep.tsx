import { View, Text, Pressable } from "react-native";
import { ThemeText } from "@/components";
import { useAppTheme } from "@/lib/theme";
import { useTranslation } from "@/lib/language";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useState } from "react";
import SleepModal from "./SleepModal";
import { MoonStar } from "lucide-react-native";
import { useStatsStore } from "@/stores/statsStore";

export default function Sleep() {
  const { theme, colors } = useAppTheme();
  const { t } = useTranslation();
  const { sleep } = useStatsStore();

  const pressed = useSharedValue(0);
  const [modalVisible, setModalVisible] = useState(false);
  const handlePressIn = () => {
    pressed.value = withTiming(1, { duration: 150 });
  };

  const handlePressOut = () => {
    pressed.value = withTiming(0, { duration: 150 });
  };

  const handlePress = () => {
    setModalVisible(true);
  };

  // Stored as minutes; the caption under the number is "hours".
  const sleepHours = Math.round((Math.max(sleep, 0) / 60) * 10) / 10;

  const animatedStyle = useAnimatedStyle(() => {
    const blurRadius = interpolate(pressed.value, [0, 1], [2, 5]);
    const color = interpolateColor(
      pressed.value,
      [0, 1],
      theme === "dark"
        ? ["#ffffff60", "#ffffff00"]
        : ["#00000040", "#00000030"],
    );
    const boxShadow = `0px 0px ${blurRadius} 0px ${color}`;
    return {
      boxShadow,
      transform: [
        {
          scale: interpolate(pressed.value, [0, 1], [1, 0.99]),
        },
      ],
    };
  });

  return (
    <Animated.View
      className="bg-card rounded-card flex-1 border-[1px] border-border"
      style={animatedStyle}
    >
      <SleepModal visible={modalVisible} setVisible={setModalVisible} />
      <Pressable
        className="flex-1 justify-between p-4 px-6"
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <View className="flex-row items-center justify-between">
          <ThemeText className="flex-1 font-bold text-lg">
            {t("sleep.sleep")}
          </ThemeText>
          <View className="w-[25px] h-[25px]">
            <MoonStar size={25} color={colors.foreground} />
          </View>
        </View>

        <View>
          <Text className="text-2xl text-muted-foreground font-semibold">
            {sleepHours}
          </Text>
          <Text className="text-sm font-normal text-subtle">
            {t("sleep.duration")}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
