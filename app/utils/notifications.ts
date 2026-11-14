/**
 * Local notification scheduling for the Settings → Notifications screen.
 *
 * Everything here is local-only (no push tokens) and web-safe: `expo-notifications`
 * throws on web, so every entry point short-circuits there instead of crashing.
 * No function in this module throws — failures are reported through the result
 * object so the UI can render a quiet status line.
 */
import * as Notifications from "expo-notifications";
import { IosAuthorizationStatus } from "expo-notifications";
import { Platform } from "react-native";

export type NotificationPrefs = {
  water: boolean;
  streak: boolean;
  workout: boolean;
  weeklyReport: boolean;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  water: true,
  streak: true,
  workout: true,
  weeklyReport: false,
};

export const NOTIFICATION_PREFS_KEY = "app-notifications";

export type ReminderSyncResult = {
  granted: boolean;
  scheduled: number;
  error?: string;
};

const isWeb = Platform.OS === "web";

const WEB_UNSUPPORTED_ERROR = "Notifications are not supported on web";
const PERMISSION_DENIED_ERROR =
  "Permission denied — enable notifications in system settings";

type Reminder = {
  title: string;
  body: string;
  hour: number;
  minute: number;
  /** expo-notifications weekday numbering: 1 = Sunday … 7 = Saturday. */
  weekday?: number;
};

/** Set once for the lifetime of the JS runtime. */
let foregroundHandlerSet = false;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return "Could not schedule notifications";
}

/** Shows notifications while the app is in the foreground. Idempotent. */
function ensureForegroundHandler(): void {
  if (foregroundHandlerSet || isWeb) return;
  foregroundHandlerSet = true;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    console.warn("Failed to configure the notification handler:", error);
  }
}

function isPermissionGranted(
  status: Notifications.NotificationPermissionsStatus,
): boolean {
  // iOS provisional authorisation delivers notifications quietly while
  // `granted` stays false, so treat it as usable.
  return (
    status.granted || status.ios?.status === IosAuthorizationStatus.PROVISIONAL
  );
}

/** Reads the current permission without prompting. */
export async function hasNotificationPermission(): Promise<boolean> {
  if (isWeb) return false;

  try {
    ensureForegroundHandler();
    return isPermissionGranted(await Notifications.getPermissionsAsync());
  } catch (error) {
    console.warn("Failed to read notification permissions:", error);
    return false;
  }
}

/** Prompts for permission only when it has not already been granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (isWeb) return false;

  try {
    ensureForegroundHandler();

    const current = await Notifications.getPermissionsAsync();
    if (isPermissionGranted(current)) return true;

    return isPermissionGranted(await Notifications.requestPermissionsAsync());
  } catch (error) {
    console.warn("Failed to request notification permissions:", error);
    return false;
  }
}

function remindersFor(prefs: NotificationPrefs): Reminder[] {
  const reminders: Reminder[] = [];

  if (prefs.water) {
    for (const hour of [9, 13, 18]) {
      reminders.push({
        title: "Time for water",
        body: "You are 500 ml behind today.",
        hour,
        minute: 0,
      });
    }
  }

  if (prefs.streak) {
    reminders.push({
      title: "Keep your streak alive",
      body: "Finish your daily tasks before midnight.",
      hour: 20,
      minute: 30,
    });
  }

  if (prefs.workout) {
    reminders.push({
      title: "Workout time",
      body: "Your plan for today is ready.",
      hour: 7,
      minute: 30,
    });
  }

  if (prefs.weeklyReport) {
    reminders.push({
      title: "Your week in review",
      body: "See how you did this week.",
      hour: 18,
      minute: 0,
      weekday: 1,
    });
  }

  return reminders;
}

function triggerFor(
  reminder: Reminder,
): Notifications.NotificationTriggerInput {
  if (reminder.weekday !== undefined) {
    return {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: reminder.weekday,
      hour: reminder.hour,
      minute: reminder.minute,
    };
  }

  return {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour: reminder.hour,
    minute: reminder.minute,
  };
}

/**
 * Makes the OS schedule match `prefs`. Idempotent: existing reminders are
 * cancelled first, so repeated calls never duplicate notifications.
 */
export async function syncScheduledReminders(
  prefs: NotificationPrefs,
): Promise<ReminderSyncResult> {
  if (isWeb) {
    return { granted: false, scheduled: 0, error: WEB_UNSUPPORTED_ERROR };
  }

  try {
    ensureForegroundHandler();

    const granted = await requestNotificationPermission();
    if (!granted) {
      return { granted: false, scheduled: 0, error: PERMISSION_DENIED_ERROR };
    }

    await cancelAllScheduledReminders();

    let scheduled = 0;
    for (const reminder of remindersFor(prefs)) {
      await Notifications.scheduleNotificationAsync({
        content: { title: reminder.title, body: reminder.body },
        trigger: triggerFor(reminder),
      });
      scheduled += 1;
    }

    return { granted: true, scheduled };
  } catch (error) {
    return { granted: false, scheduled: 0, error: toErrorMessage(error) };
  }
}

export async function cancelAllScheduledReminders(): Promise<void> {
  if (isWeb) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn("Failed to cancel scheduled notifications:", error);
  }
}

/** Schedules one immediate notification so the user can verify the setup. */
export async function scheduleTestNotification(): Promise<ReminderSyncResult> {
  if (isWeb) {
    return { granted: false, scheduled: 0, error: WEB_UNSUPPORTED_ERROR };
  }

  try {
    ensureForegroundHandler();

    const granted = await requestNotificationPermission();
    if (!granted) {
      return { granted: false, scheduled: 0, error: PERMISSION_DENIED_ERROR };
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test notification",
        body: "Reminders are working on this device.",
      },
      trigger: null,
    });

    return { granted: true, scheduled: 1 };
  } catch (error) {
    return { granted: false, scheduled: 0, error: toErrorMessage(error) };
  }
}
