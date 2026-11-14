import { useTranslation } from "@/lib/language";
import { useRegisterStore } from "@/stores/register";
import { useAppTheme } from "@/lib/theme";
import { useState } from "react";
import { Text, View } from "react-native";
import StepHeader from "./StepHeader";
import ChoiceButton from "./ChoiceButton";

export default function Step3() {
  const { setField } = useRegisterStore();
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const choices = t("register.steps.activity.choices", {
    returnObjects: true,
  }) as string[];
  const activityTitle = t("register.steps.activity.title");
  const activityDesc = t("register.steps.activity.desc");

  const { colors } = useAppTheme();
  const iconColor = colors.primaryForeground;
  const handlePress = (index: number) => {
    setSelectedIndex(index);
    setField("activityLevel", choices[index]);
  };

  return (
    <View className="flex-1 mt-28 items-center">
      <View className="flex items-center">
        <StepHeader title={activityTitle} />
        <Text className="text-subtle text-lg w-[300px] font-semibold text-center mt-4">
          {activityDesc}
        </Text>
      </View>
      <View className="space-y-4 my-4 w-full px-14">
        {choices.map((choice, i) => (
          <ChoiceButton
            key={i}
            choice={choice}
            isSelected={selectedIndex === i}
            onPress={() => handlePress(i)}
            iconColor={iconColor}
          />
        ))}
      </View>
      <View className="mb-4"></View>
    </View>
  );
}
