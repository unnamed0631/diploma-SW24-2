import React, { useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, ScrollView, View } from "react-native";
import { Icon } from "react-native-paper";
import { useFont } from "@shopify/react-native-skia";
import { useSharedValue } from "react-native-reanimated";
import { format } from "date-fns";
import { ThemeText } from "@/components";
import { useAppTheme } from "@/lib/theme";
import {
  DaySnapshot,
  getSnapshotsForLastDays,
  useStatsStore,
} from "@/stores/statsStore";
import LineChart from "@/components/graph/LineChart";
import AnimatedText from "@/components/graph/AnimatedText";

const CHART_HEIGHT = 180;
const CHART_MARGIN = 20;
const CHART_DAYS = 7;

/** `YYYY-MM-DD` (local) -> a Date at midday so timezone shifts can't move the day. */
const parseDayKey = (date: string) => new Date(`${date}T12:00:00`);

export default function Tab2() {
  const { colors } = useAppTheme();
  const { history, calories, caloriesGoal, totalCalories } = useStatsStore();

  const [selectedDate, setSelectedDate] = useState("Total");
  const selectedValue = useSharedValue(0);
  const singleValue = useSharedValue(0);
  const font = useFont(require("@/assets/fonts/Roboto-Regular.ttf"), 22);
  const [chartWidth, setChartWidth] = useState(0);

  const snapshots = useMemo(
    () => getSnapshotsForLastDays(history, CHART_DAYS),
    [history],
  );

  // Only days that actually have a recorded snapshot become points, so the line
  // never invents data for a day the app wasn't used.
  const points = useMemo(
    () => snapshots.filter((entry): entry is DaySnapshot => entry !== null),
    [snapshots],
  );

  const data: DataType[] = useMemo(
    () =>
      points.map((entry) => {
        const date = parseDayKey(entry.date);
        return {
          label: format(date, "EEE"),
          date: format(date, "EEEE, d MMM"),
          value: Math.round(entry.calories),
        };
      }),
    [points],
  );

  const sevenDayAverage = points.length
    ? Math.round(
        points.reduce((sum, entry) => sum + Math.round(entry.calories), 0) /
          points.length,
      )
    : 0;
  const recordedDayCount = points.length;
  const hasData = data.length >= 1;
  const hasTrend = data.length >= 2;

  const onLayout = (event: LayoutChangeEvent) =>
    setChartWidth(event.nativeEvent.layout.width);

  // Single-day case: keep the animated headline in sync with that day's value.
  useEffect(() => {
    if (data.length === 1) {
      singleValue.set(data[0].value);
    }
  }, [data, singleValue]);

  const metrics = [
    {
      key: "today",
      icon: "fire",
      label: "Today",
      value: `${Math.round(calories)}`,
      unit: "Kcal",
    },
    {
      key: "average",
      icon: "chart-timeline-variant",
      label: `Avg · ${recordedDayCount}d`,
      value: `${sevenDayAverage}`,
      unit: "Kcal",
    },
    {
      key: "goal",
      icon: "target",
      label: "Daily goal",
      value: `${caloriesGoal}`,
      unit: "Kcal",
    },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} className="pt-8">
      <View className="px-2">
        <View className="flex-row items-center justify-between mb-4">
          <ThemeText className="text-xl font-semibold">Calories</ThemeText>
          <ThemeText className="text-sm text-subtle">
            Last {CHART_DAYS} days
          </ThemeText>
        </View>

        {hasData ? (
          <View
            onLayout={onLayout}
            className="bg-card border border-border rounded-3xl px-2 py-4 overflow-hidden"
          >
            <ThemeText className="text-sm text-muted-foreground text-center">
              {hasTrend ? selectedDate : data[0].date}
            </ThemeText>

            {font ? (
              <View className="items-center">
                <AnimatedText
                  selectedValue={hasTrend ? selectedValue : singleValue}
                  font={font}
                />
              </View>
            ) : null}

            {hasTrend ? (
              font && chartWidth > 0 ? (
                <LineChart
                  data={data}
                  chartHeight={CHART_HEIGHT}
                  chartWidth={chartWidth}
                  chartMargin={CHART_MARGIN}
                  setSelectedDate={setSelectedDate}
                  selectedValue={selectedValue}
                />
              ) : (
                <View style={{ height: CHART_HEIGHT }} />
              )
            ) : (
              // One recorded day: no line to draw yet, so show the point itself
              // instead of pretending there is a trend.
              <View
                style={{ height: CHART_HEIGHT }}
                className="justify-center items-center"
              >
                <View className="flex-row items-center gap-3">
                  <View
                    style={{ width: 14, height: 14, borderRadius: 7 }}
                    className="bg-primary"
                  />
                  <ThemeText className="text-sm text-muted-foreground">
                    {data[0].label}
                  </ThemeText>
                </View>
                <ThemeText className="text-xs text-subtle mt-4 text-center px-8">
                  A trend line appears once a second day is recorded.
                </ThemeText>
              </View>
            )}

            {hasTrend ? (
              <ThemeText className="text-xs text-subtle text-center mt-2">
                Drag across the line to inspect a day
              </ThemeText>
            ) : null}
          </View>
        ) : (
          <View className="border-2 border-dashed border-border rounded-3xl p-6 items-center">
            <Icon
              source="chart-line"
              size={34}
              color={colors.mutedForeground}
            />
            <ThemeText className="text-base font-semibold mt-3 text-center">
              {recordedDayCount === 1
                ? "One day recorded"
                : "No daily history yet"}
            </ThemeText>
            <ThemeText className="text-sm text-subtle mt-2 text-center">
              {recordedDayCount === 1
                ? "Log a meal or update your stats tomorrow and the trend line will appear here."
                : "Your trend line appears here once two days of data have been recorded."}
            </ThemeText>
          </View>
        )}

        <View className="flex-row justify-between gap-3 mt-6">
          {metrics.map((metric) => (
            <View
              key={metric.key}
              className="flex-1 items-center bg-card border border-border rounded-2xl py-4"
            >
              <Icon source={metric.icon} size={28} color={colors.foreground} />
              <ThemeText className="text-lg font-semibold mt-2">
                {metric.value}
              </ThemeText>
              <ThemeText className="text-xs text-subtle">
                {metric.unit}
              </ThemeText>
              <ThemeText className="text-sm text-subtle mt-1">
                {metric.label}
              </ThemeText>
            </View>
          ))}
        </View>

        <View className="flex-row items-center justify-between mt-6 px-1">
          <ThemeText className="text-sm text-subtle">All time</ThemeText>
          <ThemeText className="text-sm font-semibold text-foreground">
            {Math.round(totalCalories)} Kcal
          </ThemeText>
        </View>
      </View>
    </ScrollView>
  );
}
