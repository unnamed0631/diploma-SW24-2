import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { WebView } from "react-native-webview";
import { X } from "lucide-react-native";
import { useTranslation } from "@/lib/language";
import { useAppTheme } from "@/lib/theme";

interface WorkoutDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  workout: IExercise | null;
}

const {
  width: screenWidth,
  //  height: screenHeight
} = Dimensions.get("window");

const WorkoutDetailModal: React.FC<WorkoutDetailModalProps> = ({
  isVisible,
  onClose,
  workout,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  if (!workout) return null;

  const videoHeight = screenWidth * (9 / 16);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose} // This is important for Android back button handling
    >
      <View className="flex-1 justify-end items-center bg-overlay/50">
        <View className="w-full max-h-[85vh] bg-card border-t-2 border-border rounded-t-2xl p-5 pt-10 shadow-xl">
          <Pressable
            className="absolute top-4 right-4 p-2 z-10"
            onPress={onClose} // Ensure this onPress calls the passed onClose prop
          >
            <X size={28} color={colors.foreground} />
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-5"
          >
            <Text className="text-2xl font-bold text-foreground mb-4 text-center">
              {workout.name}
            </Text>

            {workout.video && (
              <View
                className="w-full mb-5 rounded-lg overflow-hidden bg-black"
                style={{ height: videoHeight }} // Dynamic height might still need style prop
              >
                <WebView
                  className="flex-1"
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  source={{ uri: workout.video }}
                  allowsFullscreenVideo
                />
              </View>
            )}

            <View className="mb-3 py-2 border-b border-border">
              <Text className="text-base text-subtle font-semibold">
                {t("workoutModal.category")}
              </Text>
              <Text className="text-base text-foreground mt-1">
                {workout.category}
              </Text>
            </View>

            <View className="mb-3 py-2 border-b border-border">
              <Text className="text-base text-subtle font-semibold">
                {t("workoutModal.level")}
              </Text>
              <Text className="text-base text-foreground mt-1">
                {workout.level}
              </Text>
            </View>

            <View className="mb-3 py-2 border-b border-border">
              <Text className="text-base text-subtle font-semibold">
                {t("workoutModal.duration")}
              </Text>
              <Text className="text-base text-foreground mt-1">
                {workout.duration_minutes} minutes
              </Text>
            </View>

            {workout.repetitions && (
              <View className="mb-3 py-2 border-b border-border">
                <Text className="text-base text-subtle font-semibold">
                  {t("workoutModal.repetitions")}
                </Text>
                <Text className="text-base text-foreground mt-1">
                  {workout.repetitions}
                </Text>
              </View>
            )}

            {workout.sets && (
              <View className="mb-3 py-2 border-b border-border">
                <Text className="text-base text-subtle font-semibold">
                  {t("workoutModal.sets")}
                </Text>
                <Text className="text-base text-foreground mt-1">
                  {workout.sets}
                </Text>
              </View>
            )}

            <View className="mb-3 py-2 border-b border-border">
              <Text className="text-base text-subtle font-semibold">
                {t("workoutModal.equipment")}
              </Text>
              <Text className="text-base text-foreground mt-1">
                {workout.equipment || t("workoutModal.none")}
              </Text>
            </View>

            <Text className="text-lg font-bold text-foreground mt-4 mb-2">
              {t("workoutModal.description")}
            </Text>
            <Text className="text-base text-muted-foreground leading-relaxed">
              {workout.description}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default WorkoutDetailModal;
