import { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import moment from "moment";
import { formatDistanceToNow } from "date-fns";
import { Icon, ProgressBar } from "react-native-paper";
import { useAppTheme } from "@/lib/theme";
import { ThemeText } from "@/components";
import { useStatsStore } from "@/stores/statsStore";
import {
  groupEntriesByDay,
  useActivityStore,
  type ActivityEntry,
  type ActivityType,
} from "@/stores/activityStore";

const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours}h ${rest}m`;
};

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  workout: "dumbbell",
  run: "run-fast",
  meal: "food-apple",
  streak: "fire",
};

const ActivityRow = ({
  entry,
  isLast,
}: {
  entry: ActivityEntry;
  isLast: boolean;
}) => {
  const { colors } = useAppTheme();

  const meta = [
    entry.durationMinutes !== undefined ? `${entry.durationMinutes} min` : null,
    entry.calories !== undefined ? `${entry.calories} kcal` : null,
  ]
    .filter((value): value is string => value !== null)
    .join(" · ");

  return (
    <View
      className={`flex-row items-start py-3 ${
        isLast ? "" : "border-b border-border"
      }`}
    >
      <View className="bg-primary-soft rounded-full p-2">
        <Icon
          source={ACTIVITY_ICONS[entry.type]}
          size={20}
          color={colors.primary}
        />
      </View>

      <View className="flex-1 ml-3">
        <View className="flex-row items-start justify-between">
          <ThemeText
            className="text-base font-semibold flex-1 pr-3"
            numberOfLines={1}
          >
            {entry.title}
          </ThemeText>
          <ThemeText className="text-xs text-subtle">
            {formatDistanceToNow(new Date(entry.createdAt), {
              addSuffix: true,
            })}
          </ThemeText>
        </View>

        {entry.detail ? (
          <ThemeText
            className="text-sm text-muted-foreground mt-0.5"
            numberOfLines={2}
          >
            {entry.detail}
          </ThemeText>
        ) : null}

        {meta ? (
          <ThemeText className="text-xs text-subtle mt-1">{meta}</ThemeText>
        ) : null}
      </View>
    </View>
  );
};

const HorizontalDateSelector = () => {
  const { colors } = useAppTheme();
  const {
    steps,
    stepsGoal,
    calories,
    caloriesGoal,
    sleep,
    sleepGoal,
    water,
    waterGoal,
  } = useStatsStore();
  const { entries, load, clear, _hasHydrated } = useActivityStore();

  useEffect(() => {
    void load();
  }, [load]);

  const groups = groupEntriesByDay(entries);

  const handleClear = () => {
    Alert.alert(
      "Clear activity log?",
      "This removes all saved activity from this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            void clear();
          },
        },
      ],
    );
  };

  const metrics = [
    {
      key: "steps",
      icon: "shoe-print",
      label: "Steps",
      value: steps,
      goal: stepsGoal,
      display: `${steps} / ${stepsGoal}`,
    },
    {
      key: "calories",
      icon: "fire",
      label: "Calories",
      value: calories,
      goal: caloriesGoal,
      display: `${calories} / ${caloriesGoal} kcal`,
    },
    {
      key: "sleep",
      icon: "power-sleep",
      label: "Sleep",
      value: sleep,
      goal: sleepGoal,
      display: `${formatMinutes(sleep)} / ${formatMinutes(sleepGoal)}`,
    },
    {
      key: "water",
      icon: "cup-water",
      label: "Water",
      value: water,
      goal: waterGoal,
      display: `${water} / ${waterGoal} ml`,
    },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} className="pt-4">
      <View className="px-2">
        <ThemeText className="text-xl font-semibold">Today</ThemeText>
        <ThemeText className="text-sm text-subtle mb-4">
          {moment().format("dddd, D MMM")}
        </ThemeText>

        {/* Today's real intake/activity summary from the stats store */}
        <View className="bg-card border-2 border-border rounded-3xl p-4">
          {metrics.map((metric, index) => (
            <View key={metric.key} className={index > 0 ? "mt-4" : ""}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Icon
                    source={metric.icon}
                    size={22}
                    color={colors.foreground}
                  />
                  <ThemeText className="ml-2 text-base">
                    {metric.label}
                  </ThemeText>
                </View>
                <ThemeText className="text-base font-semibold">
                  {metric.display}
                </ThemeText>
              </View>
              <ProgressBar
                progress={
                  metric.goal > 0 ? Math.min(metric.value / metric.goal, 1) : 0
                }
                color={colors.primary}
                style={{ height: 6, borderRadius: 3, marginTop: 8 }}
              />
            </View>
          ))}
        </View>

        <View className="mt-6 flex-row items-center justify-between">
          <ThemeText className="text-xl font-semibold">Activity</ThemeText>
          {entries.length > 0 ? (
            <Pressable
              onPress={handleClear}
              accessibilityRole="button"
              accessibilityLabel="Clear activity log"
              hitSlop={8}
              className="flex-row items-center bg-primary-soft rounded-full px-3 py-1.5"
            >
              <Icon source="delete-outline" size={16} color={colors.primary} />
              <ThemeText className="text-xs font-semibold text-primary ml-1">
                Clear
              </ThemeText>
            </Pressable>
          ) : null}
        </View>

        {!_hasHydrated ? (
          <View className="mt-6 items-center py-6">
            <ActivityIndicator color={colors.primary} />
            <ThemeText className="text-sm text-subtle mt-2">
              Loading activity…
            </ThemeText>
          </View>
        ) : entries.length === 0 ? (
          <View className="mt-4 bg-card border-2 border-dashed border-border rounded-3xl p-6 items-center">
            <Icon source="history" size={34} color={colors.mutedForeground} />
            <ThemeText className="text-base font-semibold mt-3 text-center">
              No activity yet
            </ThemeText>
            <ThemeText className="text-sm text-subtle mt-2 text-center">
              Finish a workout in Training to see it here.
            </ThemeText>
          </View>
        ) : (
          groups.map((group) => (
            <View
              key={group.entries[0]?.id ?? group.label}
              className="mt-4 bg-card border border-border rounded-3xl p-4"
            >
              <ThemeText className="text-sm font-semibold text-muted-foreground">
                {group.label}
              </ThemeText>
              <View className="mt-1">
                {group.entries.map((entry, index) => (
                  <ActivityRow
                    key={entry.id}
                    entry={entry}
                    isLast={index === group.entries.length - 1}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default HorizontalDateSelector;
