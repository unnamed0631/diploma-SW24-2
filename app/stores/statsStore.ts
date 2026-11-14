import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

/**
 * One row of daily stats history. Kept client-side (rolling window) so the
 * profile chart and the stats date strip have something real to show without a
 * backend round-trip.
 */
export interface DaySnapshot {
  /** Local calendar day, `YYYY-MM-DD`. */
  date: string;
  steps: number;
  water: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sleep: number;
  rdc: number;
}

/** How many days of history to keep on the device. */
export const HISTORY_DAYS = 30;

/** `YYYY-MM-DD` in the device's local timezone (not UTC). */
export const toDateKey = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Returns exactly `days` entries, oldest first, ending today. Days without a
 * recorded snapshot are `null` so callers can show gaps instead of fake zeros.
 */
export const getSnapshotsForLastDays = (
  history: DaySnapshot[],
  days = 7,
): (DaySnapshot | null)[] => {
  const byDate = new Map(history.map((entry) => [entry.date, entry]));
  const today = new Date();

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));
    return byDate.get(toDateKey(date)) ?? null;
  });
};

export interface StatsData {
  steps: number;
  water: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sleep: number;
  rdc: number; //RDC stands for (e.g., Resting Daily Calories)

  stepsGoal: number;
  waterGoal: number;
  caloriesGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  sleepGoal: number;
  rdcGoal: number;

  dailyFoods: {
    [key: string]: {
      food_name: string;
      image: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  };
  streak: number;
  highestStreak: number;
  totalCalories: number;

  breakfastEaten: boolean;
  lunchEaten: boolean;
  dinnerEaten: boolean;
  snackEaten: boolean;
  /** Rolling daily snapshots, oldest first. */
  history: DaySnapshot[];
  lastUpdated: string | null;
}

export interface StatsState extends StatsData {
  setField: <K extends keyof StatsData>(
    key: K,
    value: StatsData[K],
  ) => Promise<void>;
  load: () => Promise<void>;
  _hasHydrated: boolean;
  calculateStatsFromFoods: () => void;
  addScannedFood: (food: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => Promise<void>;
  /** Writes/updates today's entry in `history` from the current values. */
  recordSnapshot: () => void;
}

const ASYNC_STORAGE_KEY = "appStatsStore";

// `dailyFoods` values come from Gemini and may be missing or stored as strings,
// so `Number(undefined)` must never leak a NaN into the totals.
const toFiniteNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getPersistentState = (state: StatsState): StatsData => {
  const { setField, load, recordSnapshot, _hasHydrated, ...persistentData } =
    state;
  return persistentData;
};

export const useStatsStore = create<StatsState>((set, get) => ({
  steps: 0,
  water: 0,
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  sleep: 0,
  rdc: 0,

  stepsGoal: 7500,
  waterGoal: 3500, // ml
  caloriesGoal: 2000,
  proteinGoal: 100, // gram
  carbsGoal: 250,
  fatGoal: 70,
  sleepGoal: 8 * 60, // 8 tsag
  rdcGoal: 0,

  dailyFoods: {},
  streak: 0,
  highestStreak: 0,
  totalCalories: 0,

  breakfastEaten: false,
  lunchEaten: false,
  dinnerEaten: false,
  snackEaten: false,

  history: [],

  lastUpdated: null as string | null,

  _hasHydrated: false,

  calculateStatsFromFoods: () => {
    const { dailyFoods, breakfastEaten, lunchEaten, dinnerEaten, snackEaten } =
      get();

    // Pure recomputation of the macro totals for the meals marked as eaten.
    // `totalCalories` is deliberately left alone: it only accumulates in
    // `addScannedFood`, otherwise every meal toggle would inflate it.
    const eatenMeals: [keyof typeof dailyFoods, boolean][] = [
      ["breakfast", breakfastEaten],
      ["lunch", lunchEaten],
      ["dinner", dinnerEaten],
      ["snack", snackEaten],
    ];

    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    for (const [meal, eaten] of eatenMeals) {
      const food = dailyFoods[meal];
      if (!eaten || !food) {
        continue;
      }
      calories += toFiniteNumber(food.calories);
      protein += toFiniteNumber(food.protein);
      carbs += toFiniteNumber(food.carbs);
      fat += toFiniteNumber(food.fat);
    }

    set((state) => ({
      ...state,
      calories,
      protein,
      carbs,
      fat,
    }));
  },

  recordSnapshot: () => {
    const state = get();
    const date = toDateKey();
    const snapshot: DaySnapshot = {
      date,
      steps: toFiniteNumber(state.steps),
      water: toFiniteNumber(state.water),
      calories: toFiniteNumber(state.calories),
      protein: toFiniteNumber(state.protein),
      carbs: toFiniteNumber(state.carbs),
      fat: toFiniteNumber(state.fat),
      sleep: toFiniteNumber(state.sleep),
      rdc: toFiniteNumber(state.rdc),
    };

    set((current) => {
      const withoutToday = current.history.filter(
        (entry) => entry.date !== date,
      );
      return {
        history: [...withoutToday, snapshot]
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-HISTORY_DAYS),
      };
    });
  },

  addScannedFood: async (food) => {
    const addedCalories = toFiniteNumber(food.calories);
    set((state) => ({
      ...state,
      calories: state.calories + addedCalories,
      protein: state.protein + toFiniteNumber(food.protein),
      carbs: state.carbs + toFiniteNumber(food.carbs),
      fat: state.fat + toFiniteNumber(food.fat),
      // Only place where the running total grows.
      totalCalories: state.totalCalories + addedCalories,
      lastUpdated: new Date().toISOString(),
    }));
    get().recordSnapshot();
    try {
      const currentState = get();
      const dataToPersist = getPersistentState(currentState);
      await AsyncStorage.setItem(
        ASYNC_STORAGE_KEY,
        JSON.stringify(dataToPersist),
      );
    } catch (error) {
      console.error(
        `StatsStore: Error saving field after adding scanned food to AsyncStorage:`,
        error,
      );
    }
  },

  load: async () => {
    if (get()._hasHydrated) {
      return;
    }

    const prune = (history: DaySnapshot[]) =>
      [...history]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-HISTORY_DAYS);

    try {
      const storedStatsJson = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
      if (storedStatsJson) {
        const storedStats = JSON.parse(storedStatsJson) as Partial<StatsData>;
        const lastUpdated = storedStats.lastUpdated;
        const storedHistory = Array.isArray(storedStats.history)
          ? storedStats.history
          : [];

        // Check if the stored stats are from today
        if (lastUpdated) {
          const storedDate = new Date(lastUpdated);
          const today = new Date();

          if (storedDate.toDateString() === today.toDateString()) {
            // Use stored stats if they're from today
            set((state) => ({
              ...state,
              ...storedStats,
              history: prune(storedHistory),
              _hasHydrated: true,
            }));
            get().recordSnapshot();
          } else {
            // Rolling over to a new day: keep yesterday as a history row before
            // resetting today's counters (covers installs from before history
            // existed, where no snapshot was written).
            const yesterdayKey = toDateKey(storedDate);
            const yesterdaySnapshot: DaySnapshot = {
              date: yesterdayKey,
              steps: toFiniteNumber(storedStats.steps),
              water: toFiniteNumber(storedStats.water),
              calories: toFiniteNumber(storedStats.calories),
              protein: toFiniteNumber(storedStats.protein),
              carbs: toFiniteNumber(storedStats.carbs),
              fat: toFiniteNumber(storedStats.fat),
              sleep: toFiniteNumber(storedStats.sleep),
              rdc: toFiniteNumber(storedStats.rdc),
            };
            const history = prune([
              ...storedHistory.filter((entry) => entry.date !== yesterdayKey),
              yesterdaySnapshot,
            ]);

            set((state) => ({
              ...state,
              steps: 0,
              water: 0,
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              sleep: 0,
              rdc: 0,
              breakfastEaten: false,
              lunchEaten: false,
              dinnerEaten: false,
              snackEaten: false,
              history,
              lastUpdated: new Date().toISOString(),
              _hasHydrated: true,
            }));
          }
        } else {
          set((state) => ({
            ...state,
            ...storedStats,
            history: prune(storedHistory),
            _hasHydrated: true,
          }));
        }
      } else {
        set({ _hasHydrated: true, lastUpdated: new Date().toISOString() });
      }
    } catch (error) {
      console.error(
        "StatsStore: Error loading stats from AsyncStorage:",
        error,
      );
      set({ _hasHydrated: true, lastUpdated: new Date().toISOString() });
    }
  },

  setField: async <K extends keyof StatsData>(key: K, value: StatsData[K]) => {
    set((state) => ({
      ...state,
      [key]: value,
      lastUpdated: new Date().toISOString(),
    }));

    // Recalculate stats if a meal eaten status changes
    if (
      key === "breakfastEaten" ||
      key === "lunchEaten" ||
      key === "dinnerEaten" ||
      key === "snackEaten"
    ) {
      get().calculateStatsFromFoods();
    }

    // Keep today's history row in sync with whatever just changed.
    get().recordSnapshot();

    try {
      const currentState = get();
      const dataToPersist = getPersistentState(currentState);

      await AsyncStorage.setItem(
        ASYNC_STORAGE_KEY,
        JSON.stringify(dataToPersist),
      );
    } catch (error) {
      console.error(
        `StatsStore: Error saving field '${key}' to AsyncStorage:`,
        error,
      );
    }
  },
}));
