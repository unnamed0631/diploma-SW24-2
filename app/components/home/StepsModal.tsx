import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import { Pencil, Check, Footprints } from "lucide-react-native";
import { ThemeText, ThemeView } from "@/components";
import FriendsActivity from "./FriendsActivity";
import { useTranslation } from "@/lib/language";
import { useAppTheme } from "@/lib/theme";
import { useStatsStore } from "@/stores/statsStore";

const MIN_STEPS_GOAL = 1000;
const MAX_STEPS_GOAL = 50000;

interface StepsModalProps {
  visible: boolean;
  setVisible: (value: boolean) => void;
}

export default function StepsModal({ visible, setVisible }: StepsModalProps) {
  const { steps, stepsGoal, setField } = useStatsStore();
  const [isEditing, setIsEditing] = useState(false);
  const [goal, setGoal] = useState(String(stepsGoal));
  const todaySteps = steps;
  const { t } = useTranslation();

  const { colors } = useAppTheme();
  const pencilColor = colors.mutedForeground;

  // Refresh the editable goal from the persisted value whenever the sheet opens.
  const handleShow = () => {
    setGoal(String(useStatsStore.getState().stepsGoal));
    setIsEditing(false);
  };

  const handleSave = () => {
    const parsed = Number(goal);
    if (
      Number.isFinite(parsed) &&
      parsed >= MIN_STEPS_GOAL &&
      parsed <= MAX_STEPS_GOAL
    ) {
      const normalized = Math.round(parsed);
      setGoal(String(normalized));
      setField("stepsGoal", normalized);
    } else {
      // Reject invalid or out-of-range input instead of persisting it.
      setGoal(String(stepsGoal));
    }
    setIsEditing(false);
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={() => setVisible(false)}
      onShow={handleShow}
      presentationStyle="pageSheet"
      animationType="slide"
    >
      <ScrollView>
        <ThemeView className="flex-1 pt-6 px-6 ">
          <Text className="text-2xl font-bold text-center mb-6 mt-10 text-foreground  ">
            {t("stepsModal.title")}
          </Text>

          <View className="bg-card rounded-2xl  border border-border flex-row p-6 justify-between items-center mb-6">
            {/* Left side: Today */}
            <View className="absolute top-5 left-8">
              <Footprints size={25} color={colors.primary} className="mb-1" />
            </View>
            <View className="flex-1 items-center">
              <Text className="text-xl text-subtle mb-1 font-quicksand font-bold">
                {t("stepsModal.today")}
              </Text>
              <Text className="text-2xl font-bold text-primary">
                {todaySteps}
              </Text>
            </View>

            {/* Divider */}
            <View className="w-px h-12 bg-muted mx-4" />

            {/* Right side: Daily Step Goal */}
            <View className="flex-1 items-center justify-center gap-1">
              <Text className="text-xl text-subtle  font-quicksand font-bold">
                {t("stepsModal.dailyGoal")}
              </Text>

              {isEditing ? (
                <TextInput
                  value={goal}
                  onChangeText={setGoal}
                  keyboardType="numeric"
                  className="text-xl font-bold text-center border-b border-border w-20 text-foreground"
                  autoFocus
                  onSubmitEditing={handleSave}
                />
              ) : (
                <Text className="text-2xl font-bold text-foreground">
                  {goal}
                </Text>
              )}

              <TouchableOpacity
                onPress={isEditing ? handleSave : () => setIsEditing(true)}
                className="absolute top-8 right-0 p-1"
              >
                {isEditing ? (
                  <Check size={20} color={colors.success} />
                ) : (
                  <Pencil size={20} color={pencilColor} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <ThemeText className="text-subtle text-sm text-center">
            {t("stepsModal.recommendation", { count: 10000 })}
          </ThemeText>

          <View className="p-2">
            <FriendsActivity />
          </View>
        </ThemeView>
      </ScrollView>
    </Modal>
  );
}
