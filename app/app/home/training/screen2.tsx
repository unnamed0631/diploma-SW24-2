import { ThemeText, ThemeView } from "@/components";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useState } from "react";
import { useTranslation } from "@/lib/language";
import { X } from "lucide-react-native";
import { Button } from "react-native-paper";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppTheme } from "@/lib/theme";

type Option = "Gym" | "Home";
const options: Option[] = ["Gym", "Home"];

const timeOptions: Record<Option, string[]> = {
  Gym: ["20min", "30min", "40min", "50min", "60min", "80min"],
  Home: ["7min", "10min", "15min", "25min", "35min", "45min"],
};

const wtypeOptions = ["Cardio", "Strength", "Stretch", "Mobility", "Endurance"];

const muscleOptions = [
  "Full Body",
  "Upper Body",
  "Lower Body",
  "Back",
  "Core",
] as const;
type MuscleGroup = (typeof muscleOptions)[number];

const subMuscleOptions = [
  "shoulders",
  "biceps",
  "triceps",
  "back",
  "chest",
  "abs",
  "lowerback",
  "glutes",
  "quadriceps",
  "hamstrings",
];

const muscleMap: Record<MuscleGroup, string[]> = {
  "Full Body": subMuscleOptions,
  "Upper Body": subMuscleOptions.slice(0, 7),
  "Lower Body": subMuscleOptions.slice(7),
  Back: ["back", "lowerback"],
  Core: ["abs", "glutes", "hamstrings"],
};
const intensityOptions = ["Basic", "Moderate", "High"];

const CUSTOM_WORKOUT_DRAFT_KEY = "customWorkoutDraft";

type CustomWorkoutDraft = {
  mode: Option;
  duration: string;
  workoutType: string;
  muscleGroup: MuscleGroup;
  subMuscle: string;
  intensity: string;
  createdAt: string;
};

const tileClass = (isSelected: boolean, isDisabled = false) =>
  `w-32 py-5 rounded-xl items-center ${
    isSelected ? "bg-foreground" : "bg-muted"
  } ${isDisabled ? "opacity-40" : ""}`;

const tileTextClass = (isSelected: boolean) =>
  `text-base font-bold ${isSelected ? "text-background" : "text-foreground"}`;

export default function Screen1() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const [selectedOption, setSelectedOption] = useState<Option>("Gym");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedWType, setSelectedWType] = useState<string>("");
  const [selectedMuscle, setSelectedMuscle] =
    useState<MuscleGroup>("Full Body");
  const [selectedSubMuscle, setSelectedSubMuscle] = useState<string>("");
  const [selectedIntensity, setSelectedIntensity] = useState<string>("");
  const [savedDraft, setSavedDraft] = useState<CustomWorkoutDraft | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isComplete =
    !!selectedWType &&
    !!selectedTime &&
    !!selectedSubMuscle &&
    !!selectedIntensity;

  const handleLocationChange = (option: Option) => {
    if (option === selectedOption) return;
    setSelectedOption(option);
    // Time slots and the Gym cardio-only restriction differ per location.
    setSelectedTime("");
    setSelectedWType("");
    setSavedDraft(null);
  };

  const handleMuscleChange = (option: MuscleGroup) => {
    setSelectedMuscle(option);
    setSelectedSubMuscle("");
    setSavedDraft(null);
  };

  const handleCreate = async () => {
    if (!isComplete || isSaving) return;
    const draft: CustomWorkoutDraft = {
      mode: selectedOption,
      duration: selectedTime,
      workoutType: selectedWType,
      muscleGroup: selectedMuscle,
      subMuscle: selectedSubMuscle,
      intensity: selectedIntensity,
      createdAt: new Date().toISOString(),
    };
    setIsSaving(true);
    setSaveError(null);
    try {
      await AsyncStorage.setItem(
        CUSTOM_WORKOUT_DRAFT_KEY,
        JSON.stringify(draft),
      );
      setSavedDraft(draft);
    } catch (error) {
      console.error("Error saving custom workout draft:", error);
      setSaveError("Could not save your session. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemeView className="flex-1 relative">
      <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
        <View className="p-8" style={{ paddingTop: insets.top + 32 }}>
          <View className="flex-row items-start justify-between gap-4">
            <ThemeText className="text-4xl font-bold">
              {t("training.custom")}
            </ThemeText>
            <Pressable
              onPress={() => router.back()}
              className="p-3 rounded-2xl bg-muted"
            >
              <X size={20} color={colors.foreground} />
            </Pressable>
          </View>

          <ThemeText className="mt-3">{t("training.custom1")}</ThemeText>

          <ThemeText className="text-3xl font-bold mt-8">
            {t("training.location")}
          </ThemeText>
          <View className="flex-row mt-3 gap-2">
            {options.map((option) => {
              const isSelected = selectedOption === option;

              return (
                <Pressable
                  key={option}
                  onPress={() => handleLocationChange(option)}
                  className={tileClass(isSelected)}
                >
                  <Text className={tileTextClass(isSelected)}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
          <ThemeText className="text-3xl font-bold mt-8">
            {t("training.wtype")}
          </ThemeText>
          <View className="flex-row mt-3 gap-2 w-full flex-wrap">
            {wtypeOptions.map((option, index) => {
              const isSelected = selectedWType === option;
              const isDisabled = selectedOption === "Gym" && index !== 0;

              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    if (!isDisabled) {
                      setSelectedWType(option);
                      setSavedDraft(null);
                    }
                  }}
                  disabled={isDisabled}
                  className={tileClass(isSelected, isDisabled)}
                >
                  <Text className={tileTextClass(isSelected)}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
          <ThemeText className="text-3xl font-bold mt-8">
            {t("training.time")}
          </ThemeText>
          <View className="flex-row mt-3 gap-2 w-full flex-wrap">
            {timeOptions[selectedOption].map((option) => {
              const isSelected = selectedTime === option;

              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    setSelectedTime(option);
                    setSavedDraft(null);
                  }}
                  className={tileClass(isSelected)}
                >
                  <Text className={tileTextClass(isSelected)}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
          <ThemeText className="text-3xl font-bold mt-8">
            {t("training.muscle")}
          </ThemeText>
          <ThemeText className="mt-3 text-muted-foreground">
            {t("training.muscle1")}
          </ThemeText>
          <View className="flex-row mt-3 gap-2 w-full flex-wrap">
            {muscleOptions.map((option) => {
              const isSelected = selectedMuscle === option;

              return (
                <Pressable
                  key={option}
                  onPress={() => handleMuscleChange(option)}
                  className={tileClass(isSelected)}
                >
                  <Text className={tileTextClass(isSelected)}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
          <View className="px-5 w-full mt-4">
            <View className="flex-row mt-3 gap-10 w-full flex-wrap">
              {subMuscleOptions.map((option) => {
                const isEnabled = muscleMap[selectedMuscle].includes(option);
                const isSelected = selectedSubMuscle === option;

                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      if (isEnabled) {
                        setSelectedSubMuscle(option);
                        setSavedDraft(null);
                      }
                    }}
                    disabled={!isEnabled}
                    className={`w-24 h-24 rounded-3xl items-center justify-center border ${
                      isSelected
                        ? "bg-foreground border-foreground"
                        : "bg-muted border-border"
                    } ${!isEnabled ? "opacity-40" : ""}`}
                  >
                    <Text className={tileTextClass(isSelected)}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <ThemeText className="text-3xl font-bold mt-8">
            {t("training.inten")}
          </ThemeText>
          <View className="flex-row mt-3 gap-2 w-full flex-wrap">
            {intensityOptions.map((option) => {
              const isSelected = selectedIntensity === option;

              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    setSelectedIntensity(option);
                    setSavedDraft(null);
                  }}
                  className={tileClass(isSelected)}
                >
                  <Text className={tileTextClass(isSelected)}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
      <View className="absolute bottom-5 left-5 right-5">
        {savedDraft ? (
          <View className="rounded-xl p-4 bg-success">
            <Text className="text-primary-foreground font-bold text-base">
              Custom session saved
            </Text>
            <Text className="text-primary-foreground/80 text-sm mt-1">
              {savedDraft.muscleGroup} · {savedDraft.duration} ·{" "}
              {savedDraft.intensity}
            </Text>
            <View className="flex-row gap-3 mt-3">
              <Pressable
                className="flex-1 bg-card rounded-lg py-2 items-center"
                onPress={() => router.push("/home/training/start")}
              >
                <Text className="text-card-foreground font-bold">
                  {t("start.start")}
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 border border-primary-foreground rounded-lg py-2 items-center"
                onPress={() => setSavedDraft(null)}
              >
                <Text className="text-primary-foreground font-bold">
                  Dismiss
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            {saveError && (
              <Text className="text-destructive text-sm mb-2">{saveError}</Text>
            )}
            <Button
              mode="contained"
              className="rounded-xl"
              disabled={!isComplete || isSaving}
              loading={isSaving}
              onPress={handleCreate}
              textColor={
                isComplete ? colors.primaryForeground : colors.mutedForeground
              }
              contentStyle={{
                paddingVertical: 12,
                backgroundColor: isComplete ? colors.primary : colors.muted,
              }}
            >
              {t("dasgal.button")}
            </Button>
          </>
        )}
      </View>
    </ThemeView>
  );
}
