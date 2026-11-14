import { useEffect, useRef, useState } from "react";
import { Pedometer } from "expo-sensors";
import { Platform } from "react-native";
import { useStatsStore } from "@/stores/statsStore";

export interface PedometerState {
  /** Whether the device has a pedometer at all. */
  available: boolean;
  /** Whether the user granted motion/activity permission. */
  permissionGranted: boolean;
  /** Best-known step count for today (~24h window plus steps since the app started). */
  todaySteps: number;
  /** @deprecated Use `permissionGranted`/`available`; kept for existing call sites. */
  isPedometerAvailable: "granted" | "denied" | "unavailable";
  pastStepCount: number;
  currentStepCount: number;
}

// Only push to the store when the pedometer moved at least this many steps, so
// a walk doesn't trigger an AsyncStorage write on every single step.
const STORE_SYNC_STEP_THRESHOLD = 10;

export function usePedometer(): PedometerState {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [available, setAvailable] = useState(false);
  const [pastStepCount, setPastStepCount] = useState<number>(0);
  const [currentStepCount, setCurrentStepCount] = useState<number>(0);

  const hasHydrated = useStatsStore((state) => state._hasHydrated);
  const lastSyncedSteps = useRef<number>(-1);

  useEffect(() => {
    let mounted = true;

    const getPermission = async () => {
      try {
        const { status } = await Pedometer.requestPermissionsAsync();
        if (mounted) {
          setPermissionGranted(status === "granted");
        }
      } catch (error) {
        console.log("Error requesting pedometer permission:", error);
      }
    };

    getPermission();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    let subscription: any = null;

    const subscribe = async () => {
      try {
        const isAvailable = await Pedometer.isAvailableAsync();
        if (!mounted) {
          return;
        }
        setAvailable(isAvailable);

        if (!isAvailable) {
          return;
        }

        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 1);

        if (Platform.OS === "ios") {
          const pastStepCountResult = await Pedometer.getStepCountAsync(
            start,
            end,
          );
          if (pastStepCountResult && mounted) {
            setPastStepCount(pastStepCountResult.steps);
          }
        }

        subscription = Pedometer.watchStepCount((result) => {
          if (mounted) {
            setCurrentStepCount(result.steps);
          }
        });
      } catch (error) {
        console.log("Error getting step count:", error);
      }
    };

    subscribe();

    return () => {
      mounted = false;
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, []);

  // `pastStepCount` is the 24h snapshot taken on mount (iOS only) and
  // `currentStepCount` counts steps since the subscription started, so their
  // sum is today's total without double counting.
  const todaySteps = pastStepCount + currentStepCount;

  // Mirror the pedometer value into the persisted stats store so the rest of
  // the app reads the same number. Waiting for hydration avoids overwriting the
  // persisted state with defaults; the threshold + change check avoid loops and
  // a write per step.
  useEffect(() => {
    if (!hasHydrated || todaySteps <= 0) {
      return;
    }
    if (
      Math.abs(todaySteps - lastSyncedSteps.current) < STORE_SYNC_STEP_THRESHOLD
    ) {
      return;
    }

    const storedSteps = useStatsStore.getState().steps;
    lastSyncedSteps.current = todaySteps;

    if (todaySteps > storedSteps) {
      useStatsStore.getState().setField("steps", todaySteps);
    }
  }, [hasHydrated, todaySteps]);

  return {
    available,
    permissionGranted,
    todaySteps,
    isPedometerAvailable: !available
      ? "unavailable"
      : permissionGranted
        ? "granted"
        : "denied",
    pastStepCount,
    currentStepCount,
  };
}
