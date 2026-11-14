import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Image,
} from "react-native";
import moment from "moment";
import { i18n, useTranslation } from "@/lib/language";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ThemeText } from "@/components";
import QuizLottie from "@/components/home/Quizlottie";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  DaySnapshot,
  getSnapshotsForLastDays,
  StatsData,
  useStatsStore,
} from "@/stores/statsStore";
import { Check, Plus } from "lucide-react-native";
import { useAppTheme } from "@/lib/theme";

const Blog = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const {
    history,
    dailyFoods,
    breakfastEaten,
    lunchEaten,
    dinnerEaten,
    snackEaten,
    calories,
    protein,
    carbs,
    fat,
    rdc,
    caloriesGoal,
    proteinGoal,
    carbsGoal,
    fatGoal,
    rdcGoal,
  } = useStatsStore();

  const NUTRIENT_BAR_HEIGHT = 170;

  // `getSnapshotsForLastDays` returns exactly 7 entries, oldest → newest and
  // ending today. Days without a recorded snapshot come back as `null`, which
  // the strip renders as dimmed, non-interactive pills.
  const stripDays = useMemo(() => {
    const snapshots = getSnapshotsForLastDays(history, 7);
    const today = moment();

    return snapshots.map((snapshot, index) => {
      const date = today.clone().subtract(snapshots.length - 1 - index, "days");
      return {
        key: date.format("YYYY-MM-DD"),
        date,
        snapshot,
        isToday: index === snapshots.length - 1,
      };
    });
  }, [history]);

  const selectedDay = selectedDate
    ? stripDays.find((day) => day.key === selectedDate)
    : undefined;

  // Only past days with a real snapshot can be viewed; today always reads live
  // store values so the screen keeps updating in real time.
  const pastSnapshot =
    selectedDay && !selectedDay.isToday ? selectedDay.snapshot : null;
  const isViewingPast = Boolean(pastSnapshot);

  const todayKey = stripDays[stripDays.length - 1]?.key;
  const activeKey = isViewingPast && selectedDay ? selectedDay.key : todayKey;
  const recordedPastDays = stripDays.filter(
    (day) => !day.isToday && day.snapshot,
  ).length;

  const dayValues = pastSnapshot ?? { calories, protein, carbs, fat, rdc };

  // Goals default to non-zero, but rdcGoal is 0 until the user sets an RDC
  // target, so bars whose goal is missing are simply not rendered instead of
  // producing NaN heights.
  const nutrientBars = [
    {
      label: "Cal",
      color: "bg-blue-300",
      value: dayValues.calories,
      goal: caloriesGoal,
    },
    {
      label: "Prot",
      color: "bg-green-200",
      value: dayValues.protein,
      goal: proteinGoal,
    },
    {
      label: "Carb",
      color: "bg-green-300",
      value: dayValues.carbs,
      goal: carbsGoal,
    },
    {
      label: "Fats",
      color: "bg-green-300",
      value: dayValues.fat,
      goal: fatGoal,
    },
    {
      label: "RDC",
      color: "bg-orange-200",
      value: dayValues.rdc,
      goal: rdcGoal,
    },
  ].filter((item) => item.goal > 0);

  const meals = [
    {
      key: "breakfast",
      image: require("@/assets/food/breakfast.png"),
      typeIndex: 0,
    },
    {
      key: "lunch",
      image: require("@/assets/food/lunch.png"),
      typeIndex: 1,
    },
    {
      key: "dinner",
      image: require("@/assets/food/dinner.png"),
      typeIndex: 2,
    },
    {
      key: "snack",
      image: require("@/assets/food/donut.png"),
      typeIndex: 3,
    },
  ];

  const eatenBySlot: Record<string, boolean> = {
    breakfast: breakfastEaten,
    lunch: lunchEaten,
    dinner: dinnerEaten,
    snack: snackEaten,
  };

  return (
    <SafeAreaView>
      <ScrollView className="bg-background">
        <View className="items-center px-10 pb-20">
          {/* Header */}
          <View className="flex-row justify-between items-center w-full mb-4">
            <ThemeText className="font-bold text-2xl">
              {t("stats.title")}
            </ThemeText>
            <Feather name="bell" size={20} color={colors.foreground} />
          </View>

          {/* Date strip: last 7 days, backed by the store's rolling history */}
          <View className="flex-row w-full mt-5 px-2">
            {stripDays.map((day) => {
              const hasData = Boolean(day.snapshot) || day.isToday;
              const isActive = day.key === activeKey;

              return (
                <Pressable
                  key={day.key}
                  onPress={() => setSelectedDate(day.isToday ? null : day.key)}
                  disabled={!hasData}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: isActive,
                    disabled: !hasData,
                  }}
                  className={`flex-1 items-center ${hasData ? "" : "opacity-40"}`}
                >
                  <Text
                    className={`text-sm mb-1 ${
                      isActive
                        ? "text-primary font-semibold"
                        : hasData
                          ? "text-muted-foreground"
                          : "text-subtle"
                    }`}
                  >
                    {day.date.format("dd").charAt(0)}
                  </Text>
                  <View
                    className={`w-9 h-9 rounded-full items-center justify-center ${
                      isActive
                        ? "bg-primary"
                        : day.isToday
                          ? "border border-primary"
                          : hasData
                            ? "bg-muted"
                            : ""
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        isActive
                          ? "text-primary-foreground font-bold"
                          : day.isToday
                            ? "text-primary font-semibold"
                            : "text-foreground"
                      }`}
                    >
                      {day.date.format("D")}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View className="items-center mt-3">
            {isViewingPast && selectedDay ? (
              <View className="flex-row items-center gap-2">
                <Text className="text-subtle text-sm">
                  Showing {selectedDay.date.format("ddd, D MMM")}
                </Text>
                <Pressable
                  onPress={() => setSelectedDate(null)}
                  className="px-3 py-1 rounded-full bg-primary/10"
                >
                  <Text className="text-primary text-xs font-semibold">
                    {t("stepsModal.today")}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text className="text-subtle text-sm">
                {t("stepsModal.today")}
              </Text>
            )}

            {recordedPastDays === 0 && (
              <Text className="text-subtle text-xs text-center mt-1">
                {"Past days will show up here as you keep using the app."}
              </Text>
            )}
          </View>

          {/* Nutrient Bars */}
          <View className="flex-row gap-7 mt-6">
            {nutrientBars.map((item) => {
              const ratio = item.value / item.goal;
              const fillHeight = Math.max(
                Math.min(ratio * NUTRIENT_BAR_HEIGHT, NUTRIENT_BAR_HEIGHT - 2),
                45,
              );
              return (
                <View
                  className="gap-3 justify-center flex-1 items-center"
                  key={item.label}
                >
                  <Text className="justify-center text-center text-subtle">
                    {item.goal}
                  </Text>
                  <View
                    className="w-14 border rounded-full border-border justify-end"
                    style={{ height: NUTRIENT_BAR_HEIGHT }}
                  >
                    <View
                      className={`w-15 ${item.color} rounded-full items-center`}
                      style={{ height: fillHeight }}
                    >
                      <View className="top-1 flex bg-white w-[40px] aspect-square rounded-full items-center justify-center">
                        <Text className="text-background font-bold text-sm">
                          {item.value}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text className="justify-center text-center text-subtle">
                    {item.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* AI Suggestion Box (today) / day recap (past days) */}
          <View className="w-full h-[180px] rounded-3xl mt-5 items-center justify-center relative overflow-hidden">
            <Image
              source={require("@/assets/img/foodPoster.png")}
              className="w-full h-full rounded-3xl"
              resizeMode="cover"
            />

            {isViewingPast && pastSnapshot && selectedDay ? (
              <View className="absolute inset-0 bg-overlay/50 rounded-3xl items-center justify-center px-6">
                <Text className="text-primary-foreground font-bold text-lg text-center">
                  Recorded that day
                </Text>
                <Text className="text-primary-foreground text-sm text-center mt-1">
                  {selectedDay.date.format("ddd, D MMM")}
                </Text>
                <Text className="text-primary-foreground text-sm text-center mt-2">
                  {`${pastSnapshot.calories} kcal · ${pastSnapshot.protein} g ${t(
                    "meal.protein",
                  ).toLowerCase()} · ${pastSnapshot.carbs} g ${t(
                    "meal.carbs",
                  ).toLowerCase()} · ${pastSnapshot.fat} g ${t(
                    "meal.fat",
                  ).toLowerCase()}`}
                </Text>
              </View>
            ) : (
              <>
                <ThemeText
                  className={`absolute text-center font-bold text-white ${
                    i18n.language === "mn"
                      ? "w-48 left-8 top-12"
                      : "w-36 text-xl top-8 left-10"
                  }`}
                >
                  {t("quiz.desc")}
                </ThemeText>

                <TouchableOpacity
                  onPress={() => router.push("/mnkv")}
                  className="absolute w-[100px] items-center rounded-full justify-center overflow-hidden"
                  style={{
                    bottom: 40,
                    left: 35,
                    height: 40,
                  }}
                >
                  <QuizLottie />
                  <Text className="text-orange-500 absolute mb-2 font-bold font-quicksand">
                    {t("quiz.title")}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Meals Section */}
          <ThemeText className="text-2xl font-bold mt-6 w-full px-2 text-foreground">
            {t("meal.meal")}
          </ThemeText>

          {isViewingPast && pastSnapshot ? (
            <PastDaySummary snapshot={pastSnapshot} />
          ) : (
            meals.map((meal) => {
              const mealTypes = t("meal.type", { returnObjects: true }) as {
                name: string;
                desc: string;
              }[];
              const food = dailyFoods?.[meal.key];
              const eaten = eatenBySlot[meal.key];

              return (
                <View
                  key={meal.key}
                  className="w-full h-28 border relative border-border rounded-3xl mt-6 flex-row items-center px-4"
                >
                  {/* Food image */}
                  <View className="w-20 h-20 rounded-full overflow-hidden">
                    <Image
                      source={meal.image}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </View>

                  {/* Text info */}
                  <View className="flex-1 ml-4">
                    <Text className="font-bold text-xl text-foreground">
                      {mealTypes[meal.typeIndex]?.name}
                    </Text>
                    <Text className="text-subtle">
                      {food
                        ? `${food.calories} cal · ${
                            eaten ? "Eaten" : "Not eaten"
                          }`
                        : "Not planned yet"}
                    </Text>
                  </View>

                  {/* Add button */}
                  <Pressable
                    onPress={() => router.push("/(meal)/nemeh")}
                    className="w-12 h-12 rounded-full bg-primary/10 justify-center items-center"
                  >
                    <Feather name="plus" size={24} color={colors.primary} />
                  </Pressable>
                </View>
              );
            })
          )}

          {!isViewingPast &&
            dailyFoods &&
            Object.keys(dailyFoods).length > 0 && <DailyRecommendation />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const DailyRecommendation = () => {
  const { t } = useTranslation();
  const {
    dailyFoods,
    breakfastEaten,
    lunchEaten,
    dinnerEaten,
    snackEaten,
    setField,
  } = useStatsStore();
  const { colors } = useAppTheme();

  return (
    <View className="mt-6 w-full">
      <Text className="text-xl font-bold mb-3 text-foreground">
        {t("meal.recommendation")}
      </Text>
      {Object.keys(dailyFoods).map((food) => {
        const { food_name, image, calories, protein, carbs, fat } =
          dailyFoods[food];

        const isEaten =
          (food === "breakfast" && breakfastEaten) ||
          (food === "lunch" && lunchEaten) ||
          (food === "dinner" && dinnerEaten) ||
          (food === "snack" && snackEaten);

        const eaten = food + "Eaten";
        return (
          <View
            key={food}
            className={`flex-row bg-card rounded-xl p-3 mb-3 items-center`}
          >
            <Image
              source={{ uri: image }}
              className="w-32 h-32 rounded-lg mr-3"
            />
            <View className="flex-1">
              <Text className={`text-base font-semibold mb-1 text-foreground`}>
                {food_name}
              </Text>
              <Text className="text-subtle mb-0.5 text-sm">
                {t("meal.calories")}: {calories}
              </Text>
              <Text className="text-subtle mb-0.5 text-sm">
                {t("meal.protein")}: {protein}
              </Text>
              <Text className="text-subtle mb-0.5 text-sm">
                {t("meal.carbs")}: {carbs}
              </Text>
              <Text className="text-subtle text-sm">
                {t("meal.fat")}: {fat}
              </Text>
            </View>
            <View className="absolute right-2 bottom-2">
              <Pressable
                onPress={() => {
                  if (!isEaten) {
                    setField(eaten as keyof StatsData, true);
                  } else {
                    setField(eaten as keyof StatsData, false);
                  }
                }}
                android_ripple={{ color: "gray", radius: 10 }}
                className="bg-muted rounded-full p-2"
              >
                {isEaten ? (
                  <Check size={20} color={colors.foreground} />
                ) : (
                  <Plus size={20} color={colors.foreground} />
                )}
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const PastDaySummary = ({ snapshot }: { snapshot: DaySnapshot }) => {
  const { t } = useTranslation();

  const totals = [
    {
      label: t("meal.calories"),
      value: `${snapshot.calories} kcal`,
    },
    { label: t("meal.protein"), value: `${snapshot.protein} g` },
    { label: t("meal.carbs"), value: `${snapshot.carbs} g` },
    { label: t("meal.fat"), value: `${snapshot.fat} g` },
  ];

  return (
    <View className="w-full bg-card border border-border rounded-3xl mt-6 p-4">
      <Text className="text-base font-bold text-foreground">
        Recorded that day
      </Text>
      <Text className="text-subtle text-sm mt-1">
        {
          "Meal plans are only kept for today, so this is the total recorded for that day."
        }
      </Text>

      <View className="mt-3">
        {totals.map((total, index) => (
          <View
            key={total.label}
            className={`flex-row justify-between items-center py-2 ${
              index < totals.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <Text className="text-muted-foreground">{total.label}</Text>
            <Text className="text-foreground font-semibold">{total.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default Blog;
