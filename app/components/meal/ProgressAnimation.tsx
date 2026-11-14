import React from "react";
import { View, Text, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";
import Reanimated, {
  interpolate,
  useDerivedValue,
} from "react-native-reanimated";

interface ProgressAnimationProps {
  title: string;
  progressText: string;
  progress: number;
}

export default function ProgressAnimation({
  title,
  progressText,
  progress,
}: ProgressAnimationProps) {
  const backgroundColor = "bg-background";

  const progressInterpolate = useDerivedValue(() => {
    return interpolate(progress, [0, 1], [0, 100]);
  });

  return (
    <View
      className={`flex-1 justify-end items-center px-5 pb-40 ${backgroundColor}`}
    >
      <View className="absolute top-10 left-0 right-0 items-center mt-10">
        <LottieView
          source={require("@/assets/mascot/bluvifood.json")}
          loop
          autoPlay
          style={styles.animation}
        />
      </View>

      <View className="items-center mb-8">
        <Text className={`text-lg font-bold text-center text-foreground`}>
          {title}
        </Text>
      </View>

      <View className="w-full items-center">
        <View className="w-full h-2 bg-muted rounded-full">
          <Reanimated.View
            style={{
              width: progressInterpolate.value,
            }}
            className="h-full bg-primary rounded-full"
          />
        </View>

        <Text className="text-base mt-2 text-foreground">{progressText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  animation: {
    width: 400,
    height: 420,
  },
});
