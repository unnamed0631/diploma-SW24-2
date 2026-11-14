import { useTranslation } from "@/lib/language";
import { View, Text, Pressable } from "react-native";
import { useAppTheme } from "@/lib/theme";
import { ThemeText } from "@/components";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useState } from "react";
import { Footprints } from "lucide-react-native";
import StepsModal from "./StepsModal";
import { usePedometer } from "@/hooks/usePedometer";
import { useStatsStore } from "@/stores/statsStore";
export default function Steps() {
  const { t } = useTranslation();
  const { theme, colors } = useAppTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const { steps } = useStatsStore();
  const { todaySteps, permissionGranted } = usePedometer();

  // The store is the source of truth once the pedometer has synced into it.
  const displayedSteps = steps > 0 ? steps : todaySteps;

  const handlePressIn = () => {
    pressed.value = withTiming(1, { duration: 150 });
  };

  const handlePressOut = () => {
    pressed.value = withTiming(0, { duration: 150 });
  };

  const handlePress = () => {
    setModalVisible(true);
  };

  const pressed = useSharedValue(0);
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
      <StepsModal visible={modalVisible} setVisible={setModalVisible} />
      <Pressable
        className="flex-1 justify-between p-4 px-6"
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <View className="flex-row items-center justify-between">
          <ThemeText className="flex-1 font-bold text-lg ">
            {t("walk.steps")}
          </ThemeText>
          <View className="w-[25px] h-[20px]">
            <Footprints color={colors.foreground} size={25} />
          </View>
        </View>

        <View>
          {displayedSteps > 0 || permissionGranted ? (
            <Text className="text-2xl text-muted-foreground font-semibold">
              {displayedSteps}
            </Text>
          ) : (
            <Text className="text-xs text-muted-foreground">
              {t("walk.allowPermission")}
            </Text>
          )}
          <Text className="text-sm font-normal text-subtle">
            {t("walk.stepsCount")}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
