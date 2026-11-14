import React, { use, useMemo, useState } from "react";
import {
  Platform,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import moment, { Moment } from "moment";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "@/lib/language";
import { ArrowRight, ChevronRight, X } from "lucide-react-native";
import { AuthContext } from "@/context/auth";
import WorkoutListItem from "@/components/WorkoutListItem";
import { useAppTheme } from "@/lib/theme";

/**
 * `expo-mesh-gradient` ships native views only (SwiftUI on iOS, a shader on
 * Android). Its module calls `requireNativeView` at import time and that throws
 * on web, so resolve it lazily and only where a native view exists.
 */
const MeshGradientView =
  Platform.OS === "web"
    ? null
    : // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy so web never evaluates the native-only module
      (require("expo-mesh-gradient") as typeof import("expo-mesh-gradient"))
        .MeshGradientView;

const MESH_COLUMNS = 3;
const MESH_ROWS = 3;
const MESH_POINTS: number[][] = [
  [0, 0],
  [0.5, 0],
  [1, 0],
  [0, 0.5],
  [0.5, 0.5],
  [1, 0.5],
  [0, 1],
  [0.5, 1],
  [1, 1],
];

const shortName = (value: string, max = 10) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

export default function Training() {
  const [dates] = useState<Moment[]>(() => {
    const today = moment();
    return Array.from({ length: 7 }, (_, i) => today.clone().add(i, "days"));
  });
  const [selectedDate, setSelectedDate] = useState(
    moment().format("YYYY-MM-DD"),
  );
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, colors } = useAppTheme();

  // One colour per mesh point (columns * rows). Palette goes from canvas to
  // brand tint so the gradient reads as a soft glow behind the header.
  const meshColors =
    theme === "dark"
      ? [
          colors.background,
          colors.card,
          colors.primarySoft,
          colors.card,
          colors.primarySoft,
          colors.background,
          colors.primarySoft,
          colors.background,
          colors.card,
        ]
      : [
          colors.background,
          colors.muted,
          colors.primarySoft,
          colors.muted,
          colors.primarySoft,
          colors.background,
          colors.primarySoft,
          colors.background,
          colors.muted,
        ];

  const { user, workouts } = use(AuthContext);
  const plan = useMemo(() => (workouts ?? []) as IExercise[], [workouts]);
  const highlighted = plan[0] ?? null;
  const chips = useMemo(
    () => plan.slice(0, 4).map((workout) => shortName(workout.name)),
    [plan],
  );

  const handleSelectDate = (date: Moment) => {
    setSelectedDate(date.format("YYYY-MM-DD"));
  };

  const handleWorkoutPress = (workout: IExercise) => {
    router.push({
      pathname: "/home/training/screen1",
      params: { id: String(workout.id) },
    });
  };

  const handleMyWorkouts = () => {
    router.push("/home/training/screen2");
  };

  return (
    <View className="flex-1 bg-background">
      {MeshGradientView ? (
        <View
          pointerEvents="none"
          className="absolute left-0 right-0 top-0 h-[420px]"
          style={{ opacity: theme === "dark" ? 0.5 : 0.6 }}
        >
          <MeshGradientView
            style={{ flex: 1 }}
            columns={MESH_COLUMNS}
            rows={MESH_ROWS}
            points={MESH_POINTS}
            colors={meshColors}
            smoothsColors
          />
        </View>
      ) : null}

      <ScrollView className="flex-1">
        <View className="p-6 flex-1">
          {/* Main Content */}
          <View className="flex-1">
            {/* Calendar */}
            <View className="p-2">
              <View className="flex-row justify-end mt-4">
                <Pressable
                  onPress={() => router.back()}
                  className="p-3 rounded-2xl bg-muted"
                >
                  <X size={20} color={colors.foreground} />
                </Pressable>
              </View>
              <View className="flex-row justify-between mt-4">
                {dates.map((date) => {
                  const isSelected = selectedDate === date.format("YYYY-MM-DD");
                  return (
                    <TouchableOpacity
                      key={date.format("YYYY-MM-DD")}
                      onPress={() => handleSelectDate(date)}
                      activeOpacity={0.7}
                      className={`items-center px-3 py-2 rounded-2xl ${
                        isSelected ? "bg-muted/40" : "bg-none"
                      }`}
                    >
                      <Text className="text-xs text-muted-foreground">
                        {date.format("dd").charAt(0)}
                      </Text>
                      <Text className="text-foreground font-bold text-base">
                        {date.format("D")}
                      </Text>
                      {isSelected && (
                        <View className="flex flex-row mt-1">
                          <View className="w-1 h-1 bg-foreground rounded-full mx-0.5" />
                          <View className="w-1 h-1 bg-foreground rounded-full mx-0.5" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text className="text-3xl text-start font-semibold mt-4 text-foreground">
                {t("training.hi")}
                {user?.username ? `, ${user.username}` : ""}!
              </Text>
              <Text className="text-lg text-start mt-2 text-muted-foreground">
                {t("training.hello")}
              </Text>

              {/* Highlight Workout Block */}
              {highlighted ? (
                <Pressable
                  className="w-full bg-blue-200/30 relative rounded-3xl mt-4 p-6"
                  onPress={() => handleWorkoutPress(highlighted)}
                >
                  <View className="flex-row items-start gap-4">
                    <View className="p-2 bg-primary rounded-full items-center">
                      <Text className="text-primary-foreground text-[11px] font-semibold p-1">
                        {t("training.special")}
                      </Text>
                    </View>
                    <View className="p-2 px-4 bg-gray-300/40 rounded-full items-center">
                      <Text className="text-foreground p-1 text-[11px] font-semibold">
                        {highlighted.category}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-foreground font-bold text-4xl mt-8">
                    {highlighted.duration_minutes} {t("training.duration")}
                  </Text>
                  <Text className="text-base text-foreground">
                    {highlighted.name}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {highlighted.level}
                  </Text>

                  <View className="flex-row mt-6 gap-2">
                    {chips.map((chip, index) => (
                      <View
                        key={`${chip}-${index}`}
                        className="flex-1 aspect-square max-w-16 rounded-2xl bg-white dark:bg-neutral-800 px-1 items-center justify-center"
                      >
                        <Text
                          numberOfLines={2}
                          className="text-[10px] font-semibold text-center text-foreground"
                        >
                          {chip}
                        </Text>
                      </View>
                    ))}
                    <Pressable
                      className="flex-1 aspect-square max-w-16 rounded-2xl bg-white dark:bg-neutral-800 items-center justify-center"
                      onPress={() => handleWorkoutPress(highlighted)}
                    >
                      <ArrowRight size={32} color={colors.foreground} />
                    </Pressable>
                  </View>
                </Pressable>
              ) : (
                <View className="w-full bg-primary-soft rounded-3xl mt-4 p-6 items-center border border-dashed border-border">
                  <Text className="text-xl font-bold text-foreground text-center">
                    No workout plan yet
                  </Text>
                  <Text className="text-sm text-muted-foreground text-center mt-2">
                    Create a custom session and we will build one around your
                    goals.
                  </Text>
                  <Pressable
                    className="mt-5 bg-primary rounded-xl px-6 py-3"
                    onPress={handleMyWorkouts}
                  >
                    <Text className="text-primary-foreground font-semibold">
                      {t("training.custom")}
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Custom Workouts Block */}
              <Pressable
                className="flex-row border rounded-3xl border-border w-full mt-10 p-4 items-center justify-between gap-4"
                onPress={handleMyWorkouts}
              >
                <View className="flex-row gap-4 items-center">
                  <View className="w-16 h-16 bg-muted rounded-3xl justify-center items-center">
                    <Feather
                      name="sliders"
                      size={20}
                      color={colors.foreground}
                    />
                  </View>
                  <Text className="font-semibold text-lg text-foreground">
                    {t("training.custom")}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.foreground} />
              </Pressable>
            </View>

            {plan.length > 0 && (
              <View className="mt-6 mb-6">
                <Text className="text-2xl font-bold text-foreground mb-4">
                  Your Daily Workouts
                </Text>
                {plan.map((workout) => (
                  <WorkoutListItem
                    key={workout.id}
                    item={workout}
                    onPress={() => handleWorkoutPress(workout)}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
