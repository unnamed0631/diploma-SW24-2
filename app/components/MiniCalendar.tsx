import { ThemeText } from "@/components";
import { View, Text, Pressable, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { format, startOfMonth, endOfMonth, getDay, getDate } from "date-fns";
import { useState } from "react";
import { useAppTheme } from "@/lib/theme";

const weekdayShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MiniCalendar({
  currentDate,
  completedDays,
  onPrevMonth,
  onNextMonth,
  isNextDisabled,
}: {
  currentDate: Date;
  completedDays: number[];
  onToggleComplete: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  isNextDisabled: boolean;
}) {
  const today = new Date();
  const { colors } = useAppTheme();
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const totalDays = getDate(end);
  const startDay = (getDay(start) + 6) % 7;
  const daysArray = Array(startDay)
    .fill(null)
    .concat([...Array(totalDays)].map((_, i) => i + 1));

  const isToday = (date: number) =>
    today.getDate() === date &&
    today.getMonth() === currentDate.getMonth() &&
    today.getFullYear() === currentDate.getFullYear();

  const isCompleted = (date: number) => completedDays.includes(date);

  return (
    <View className="w-full border-2 border-border p-3 rounded-xl">
      {/* Header with month & nav */}
      <View className="flex-row justify-between items-center mb-4 px-2">
        <ArrowButton direction="left" onPress={onPrevMonth} />
        <Text className="text-lg font-bold text-foreground">
          {format(currentDate, "MMMM, yyyy")}
        </Text>
        {isNextDisabled ? (
          <View className="bg-muted rounded-full p-1">
            <Feather name="chevron-right" size={22} color={colors.subtle} />
          </View>
        ) : (
          <ArrowButton direction="right" onPress={onNextMonth} />
        )}
      </View>

      {/* Weekday header */}
      <View className="flex-row justify-between mb-1 mt-2">
        {weekdayShort.map((day, i) => (
          <Text
            key={i}
            className="flex-1 text-center text-md font-bold text-subtle"
          >
            {day}
          </Text>
        ))}
      </View>

      {/* Dates grid */}
      <View className="flex-row flex-wrap mt-3">
        {daysArray.map((day, index) => {
          const isTodayDate = isToday(day);
          const isStreakDay = isCompleted(day);

          return (
            <View
              key={index}
              className="w-[14.28%] aspect-square items-center justify-center p-1"
            >
              {day ? (
                <Pressable
                  // onPress={() => onToggleComplete(day)}
                  className={`
                    w-12 h-12 rounded-full items-center justify-center
                    ${isStreakDay ? "bg-primary" : ""}
                    ${
                      isTodayDate && !isStreakDay
                        ? "border-2 border-primary"
                        : ""
                    }
                  `}
                >
                  <Text
                    className={`${
                      isStreakDay
                        ? "text-primary-foreground"
                        : "text-subtle text-md font-bold"
                    }`}
                  >
                    {day}
                  </Text>
                </Pressable>
              ) : (
                <Text className="text-transparent">0</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const ArrowButton = ({
  direction,
  onPress,
}: {
  direction: "left" | "right";
  onPress: () => void;
}) => {
  const [scaleAnim] = useState(() => new Animated.Value(1));
  const [pressed, setPressed] = useState(false);
  const { colors } = useAppTheme();

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.85,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    onPress();
    setPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <View
          className={`${
            pressed ? "bg-primary/80" : "bg-primary"
          } rounded-full p-1`}
        >
          <ThemeText className="text-primary-foreground">
            <Feather
              name={direction === "left" ? "chevron-left" : "chevron-right"}
              size={22}
              color={colors.primaryForeground}
            />
          </ThemeText>
        </View>
      </Pressable>
    </Animated.View>
  );
};
