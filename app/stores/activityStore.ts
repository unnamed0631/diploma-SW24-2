import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { format, isToday, isYesterday } from "date-fns";

export type ActivityType = "workout" | "run" | "meal" | "streak";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  title: string;
  detail?: string;
  durationMinutes?: number;
  calories?: number;
  reps?: number;
  createdAt: string;
}

interface ActivityState {
  entries: ActivityEntry[];
  _hasHydrated: boolean;
  load: () => Promise<void>;
  addEntry: (
    entry: Omit<ActivityEntry, "id" | "createdAt"> & { createdAt?: string },
  ) => Promise<void>;
  clear: () => Promise<void>;
}

export const ACTIVITY_STORAGE_KEY = "appActivityLog";

/** Keep the log small enough that parsing/persisting stays cheap. */
export const MAX_ACTIVITY_ENTRIES = 200;

const ACTIVITY_TYPES: ActivityType[] = ["workout", "run", "meal", "streak"];

const isActivityType = (value: unknown): value is ActivityType =>
  typeof value === "string" &&
  (ACTIVITY_TYPES as readonly string[]).includes(value);

const optionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

const optionalNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const createId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/**
 * Drops anything that isn't a usable entry instead of letting corrupt/legacy
 * storage crash the Timeline.
 */
const sanitizeEntry = (raw: unknown): ActivityEntry | null => {
  if (!raw || typeof raw !== "object") return null;

  const value = raw as Record<string, unknown>;
  if (
    typeof value.id !== "string" ||
    value.id.length === 0 ||
    !isActivityType(value.type) ||
    typeof value.title !== "string" ||
    value.title.length === 0 ||
    typeof value.createdAt !== "string" ||
    Number.isNaN(Date.parse(value.createdAt))
  ) {
    return null;
  }

  return {
    id: value.id,
    type: value.type,
    title: value.title,
    detail: optionalString(value.detail),
    durationMinutes: optionalNumber(value.durationMinutes),
    calories: optionalNumber(value.calories),
    reps: optionalNumber(value.reps),
    createdAt: value.createdAt,
  };
};

const parseStoredEntries = (raw: string | null): ActivityEntry[] => {
  if (!raw) return [];

  const parsed: unknown = JSON.parse(raw);
  const list: unknown[] = Array.isArray(parsed)
    ? parsed
    : parsed &&
        typeof parsed === "object" &&
        Array.isArray((parsed as { entries?: unknown }).entries)
      ? (parsed as { entries: unknown[] }).entries
      : [];

  return list
    .map(sanitizeEntry)
    .filter((entry): entry is ActivityEntry => entry !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_ACTIVITY_ENTRIES);
};

const persistEntries = async (entries: ActivityEntry[]) => {
  try {
    await AsyncStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error("ActivityStore: failed to persist activity log:", error);
  }
};

export const useActivityStore = create<ActivityState>((set, get) => ({
  entries: [],
  _hasHydrated: false,

  load: async () => {
    if (get()._hasHydrated) return;

    try {
      const raw = await AsyncStorage.getItem(ACTIVITY_STORAGE_KEY);
      set({ entries: parseStoredEntries(raw), _hasHydrated: true });
    } catch (error) {
      console.error("ActivityStore: failed to load activity log:", error);
      set({ entries: [], _hasHydrated: true });
    }
  },

  addEntry: async (entry) => {
    // Hydrate before writing: this can be called from the tracking screen
    // before the Timeline has ever mounted, and prepending to an empty list
    // would otherwise overwrite the stored history.
    if (!get()._hasHydrated) {
      await get().load();
    }

    const nextEntry: ActivityEntry = {
      ...entry,
      id: createId(),
      createdAt: entry.createdAt ?? new Date().toISOString(),
    };

    const entries = [nextEntry, ...get().entries].slice(
      0,
      MAX_ACTIVITY_ENTRIES,
    );

    set({ entries });
    await persistEntries(entries);
  },

  clear: async () => {
    set({ entries: [] });

    try {
      await AsyncStorage.removeItem(ACTIVITY_STORAGE_KEY);
    } catch (error) {
      console.error("ActivityStore: failed to clear activity log:", error);
    }
  },
}));

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

const dayLabel = (date: Date) => {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "d MMM");
};

/**
 * Groups entries into local calendar days, newest day first. Entries are
 * assumed to be stored newest first but are sorted defensively.
 */
export const groupEntriesByDay = (
  entries: ActivityEntry[],
): { label: string; entries: ActivityEntry[] }[] => {
  const groups: { label: string; entries: ActivityEntry[] }[] = [];
  const groupsByDay = new Map<
    string,
    { label: string; entries: ActivityEntry[] }
  >();

  const sorted = [...entries].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  for (const entry of sorted) {
    const createdAt = new Date(entry.createdAt);
    if (Number.isNaN(createdAt.getTime())) continue;

    const key = dayKey(createdAt);
    const existing = groupsByDay.get(key);
    if (existing) {
      existing.entries.push(entry);
      continue;
    }

    const group = { label: dayLabel(createdAt), entries: [entry] };
    groupsByDay.set(key, group);
    groups.push(group);
  }

  return groups;
};
