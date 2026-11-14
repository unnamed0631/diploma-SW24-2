import { View, Text, Modal, ScrollView, Pressable } from "react-native";
import { X } from "lucide-react-native";
import { ThemeView } from "@/components";
import { useTranslation } from "@/lib/language";
import { useAppTheme } from "@/lib/theme";
import { useStatsStore } from "@/stores/statsStore";

const MEAL_KEYS = ["breakfast", "lunch", "dinner", "snack"] as const;

function CaloriesModal({
  visible,
  setVisible,
}: {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const {
    dailyFoods,
    breakfastEaten,
    lunchEaten,
    dinnerEaten,
    snackEaten,
    calories,
    protein,
    carbs,
    fat,
    caloriesGoal,
  } = useStatsStore();

  const eatenByMeal: Record<string, boolean> = {
    breakfast: breakfastEaten,
    lunch: lunchEaten,
    dinner: dinnerEaten,
    snack: snackEaten,
  };

  const loggedMeals = MEAL_KEYS.filter((meal) => dailyFoods[meal] != null);

  const totals = [
    { label: t("meal.calories"), value: Math.round(calories || 0) },
    { label: t("meal.protein"), value: Math.round(protein || 0) },
    { label: t("meal.carbs"), value: Math.round(carbs || 0) },
    { label: t("meal.fat"), value: Math.round(fat || 0) },
  ];

  return (
    <Modal
      visible={visible}
      onRequestClose={() => setVisible(false)}
      presentationStyle="pageSheet"
      animationType="slide"
    >
      <ThemeView className="flex-1 px-8 pt-12">
        <Pressable
          className="absolute top-4 right-4 p-2 z-10"
          onPress={() => setVisible(false)}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <X size={28} color={colors.foreground} />
        </Pressable>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-10"
        >
          <Text className="text-2xl font-bold text-center mt-4 mb-2 text-foreground">
            {t("calories.calorie")}
          </Text>
          <Text className="text-center text-base text-subtle mb-8">
            {Math.round(calories || 0)} / {caloriesGoal} {t("calories.kcal")}
          </Text>

          {loggedMeals.length === 0 ? (
            <Text className="text-center text-subtle mt-10">
              No meals logged yet.
            </Text>
          ) : (
            loggedMeals.map((meal) => {
              const food = dailyFoods[meal];
              const isEaten = eatenByMeal[meal];
              return (
                <View
                  key={meal}
                  className="w-full bg-muted rounded-2xl p-4 mb-3"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="flex-1 text-base font-semibold text-foreground">
                      {food.food_name}
                    </Text>
                    <View
                      className={`px-2 py-1 rounded-full ${
                        isEaten ? "bg-primary-soft" : "bg-muted"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          isEaten ? "text-primary" : "text-subtle"
                        }`}
                      >
                        {isEaten ? "Eaten" : "Not eaten"}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-sm text-subtle">
                    {t("meal.calories")}: {food.calories}
                  </Text>
                  <Text className="text-sm text-subtle">
                    {t("meal.protein")}: {food.protein}
                  </Text>
                  <Text className="text-sm text-subtle">
                    {t("meal.carbs")}: {food.carbs}
                  </Text>
                  <Text className="text-sm text-subtle">
                    {t("meal.fat")}: {food.fat}
                  </Text>
                </View>
              );
            })
          )}

          <View className="w-full bg-card rounded-2xl border border-border p-4 mt-4">
            <Text className="text-base font-bold text-foreground mb-3">
              Totals
            </Text>
            {totals.map((total) => (
              <View
                key={total.label}
                className="flex-row justify-between items-center mb-1"
              >
                <Text className="text-sm text-subtle">{total.label}</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {total.value}
                </Text>
              </View>
            ))}
            <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-border">
              <Text className="text-sm text-subtle">Goal</Text>
              <Text className="text-sm font-semibold text-primary">
                {caloriesGoal} {t("calories.kcal")}
              </Text>
            </View>
          </View>
        </ScrollView>
      </ThemeView>
    </Modal>
  );
}

export default CaloriesModal;
