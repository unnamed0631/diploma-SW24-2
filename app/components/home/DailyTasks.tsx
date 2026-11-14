import React, { useEffect, useCallback, useRef, useContext } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  AppState,
} from "react-native";
import { CheckCircle2, Circle } from "lucide-react-native";
import { useTranslation } from "@/lib/language";
import { ThemeText } from "@/components";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { useAppTheme } from "@/lib/theme";
import useDailyTaskStore, { Task } from "@/stores/dailyTaskStore";
import { usePedometer } from "@/hooks/usePedometer";
import { AuthContext } from "@/context/auth";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: true,
});

export default function DailyTasks() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const { user, incrementStreak } = useContext(AuthContext);

  const { tasks, isLoading, initializeTasks } = useDailyTaskStore();
  const incrementTaskProgressAction = useDailyTaskStore(
    (state) => state.incrementTaskProgress,
  );
  const setTaskProgressAction = useDailyTaskStore(
    (state) => state.setTaskProgress,
  );
  const setTriggerAuthStreakIncrement = useDailyTaskStore(
    (state) => state.setTriggerAuthStreakIncrement,
  );

  // Memoize triggerFn to stabilize its reference
  const triggerFn = useCallback(async () => {
    if (user) {
      return await incrementStreak();
    } else {
      console.log("DailyTasks: User not available for streak increment.");
      return Promise.resolve(false);
    }
  }, [user, incrementStreak]);

  useEffect(() => {
    // Check if incrementStreak is a valid function before using it
    if (typeof incrementStreak === "function") {
      setTriggerAuthStreakIncrement(triggerFn);
    } else {
      console.log(
        "DailyTasks: incrementStreak function not available from AuthContext or not a function.",
      );
    }
    // Dependencies for this effect:
    // - triggerFn: Now memoized, changes only if user or incrementStreak changes.
    // - incrementStreak: Memoized in AuthContext, changes if its own dependencies (like user) change.
    // - setTriggerAuthStreakIncrement: Stable from Zustand store.
  }, [triggerFn, incrementStreak, setTriggerAuthStreakIncrement]);

  const { currentStepCount, pastStepCount: stepsTodayTotal } = usePedometer();
  const appState = useRef<string>(AppState.currentState ?? "unknown");

  useEffect(() => {
    initializeTasks(t);
  }, [initializeTasks, t, i18n.language]);

  const updateStepTaskProgress = useCallback(async () => {
    const walkTask = tasks.find(
      (task) => task.templateId.startsWith("walk_steps_") && !task.completed,
    );

    if (walkTask) {
      try {
        if (stepsTodayTotal !== walkTask.current) {
          await setTaskProgressAction(
            walkTask.id,
            stepsTodayTotal > 0 ? stepsTodayTotal : currentStepCount,
          );
        } else {
        }
      } catch (error) {
        console.log("Error fetching today's step count for daily task:", error);
      }
    }
  }, [tasks, setTaskProgressAction, currentStepCount, stepsTodayTotal]);

  useEffect(() => {
    updateStepTaskProgress();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        updateStepTaskProgress();
      }
      appState.current = nextAppState;
    });

    const intervalId = setInterval(() => {
      if (AppState.currentState === "active") {
        updateStepTaskProgress();
      }
    }, 60000);

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, [updateStepTaskProgress]);

  const completedCount = tasks.filter((task) => task.completed).length;

  if (isLoading && tasks.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={colors.foreground} />
      </View>
    );
  }

  return (
    <View className="px-1 mt-6 pb-40">
      <View className="flex-row justify-between mb-4 items-center">
        <ThemeText className="text-xl font-bold">{t("home.task")}</ThemeText>
        <Text className="text-sm text-subtle">
          {t("dailyTasks.completedFraction", {
            completedCount,
            totalTasks: tasks.length,
          })}
        </Text>
      </View>

      <View className="space-y-3 gap-3">
        {tasks.map((task: Task) => {
          const containerClasses = `
  p-4 rounded-3xl flex-col border-1
  ${
    task.completed
      ? "border-primary border border-l-[3px] bg-primary-soft"
      : "border-border border border-l-[3px] bg-card"
  }
`;
          return (
            <Pressable
              key={task.id}
              onPress={() => {
                if (!task.templateId.startsWith("walk_steps_")) {
                  incrementTaskProgressAction(task.id);
                }
              }}
              className={containerClasses}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <View className="flex-row items-center space-x-2 mb-1 gap-2">
                    <Text className="text-sm font-semibold text-foreground">
                      {task.title}
                    </Text>
                    <Text className="text-xl">{task.icon}</Text>
                  </View>
                  <Text className="text-xs text-subtle mb-2">
                    {task.target}
                  </Text>

                  <View className="h-1.5 bg-muted rounded-full mb-2 w-full">
                    <View
                      className={`h-full rounded-full ${
                        task.completed
                          ? "bg-primary"
                          : "bg-cyan-200 dark:bg-cyan-300"
                      }`}
                      style={{ width: `${(task.current / task.max) * 100}%` }}
                    />
                  </View>

                  <Text className="text-xs text-subtle">
                    {task.current}/{task.max} {task.unit}
                  </Text>
                </View>

                <View className="items-center justify-center">
                  {task.completed ? (
                    <View className="rounded-full p-1 bg-primary-soft">
                      <CheckCircle2 size={18} color={colors.primary} />
                    </View>
                  ) : (
                    <Circle size={18} color={colors.subtle} />
                  )}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
