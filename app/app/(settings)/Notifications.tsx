import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  View,
} from "react-native";
import { Icon } from "react-native-paper";
import { ThemeText, ThemeView } from "@/components";
import { SettingsItem } from "@/components/SettingsItem";
import { useTranslation } from "@/lib/language";
import { useAppTheme } from "@/lib/theme";
import {
  DEFAULT_NOTIFICATION_PREFS,
  hasNotificationPermission,
  NOTIFICATION_PREFS_KEY,
  scheduleTestNotification,
  syncScheduledReminders,
  type NotificationPrefs,
  type ReminderSyncResult,
} from "@/utils/notifications";

const isWeb = Platform.OS === "web";

const PERMISSION_DENIED =
  "Permission denied — enable notifications in system settings";

function normalizePrefs(parsed: Partial<NotificationPrefs>): NotificationPrefs {
  return {
    water:
      typeof parsed.water === "boolean"
        ? parsed.water
        : DEFAULT_NOTIFICATION_PREFS.water,
    streak:
      typeof parsed.streak === "boolean"
        ? parsed.streak
        : DEFAULT_NOTIFICATION_PREFS.streak,
    workout:
      typeof parsed.workout === "boolean"
        ? parsed.workout
        : DEFAULT_NOTIFICATION_PREFS.workout,
    weeklyReport:
      typeof parsed.weeklyReport === "boolean"
        ? parsed.weeklyReport
        : DEFAULT_NOTIFICATION_PREFS.weeklyReport,
  };
}

function describeStatus(
  result: ReminderSyncResult,
  successText?: string,
): string {
  if (!result.granted) return result.error ?? PERMISSION_DENIED;
  if (result.error) return result.error;
  if (successText) return successText;
  if (result.scheduled === 0) return "No reminders scheduled";
  if (result.scheduled === 1) return "1 reminder scheduled";
  return `${result.scheduled} reminders scheduled`;
}

export default function Notifications() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const [preferences, setPreferences] = useState<NotificationPrefs>(
    DEFAULT_NOTIFICATION_PREFS,
  );
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const mounted = useRef(true);
  // Reminder syncs cancel and re-schedule everything, so run them one at a
  // time — otherwise rapid toggles can interleave and leave a stale schedule.
  const syncQueue = useRef<Promise<void>>(Promise.resolve());

  const queueSync = useCallback((nextPrefs: NotificationPrefs) => {
    syncQueue.current = syncQueue.current
      .then(async () => {
        const result = await syncScheduledReminders(nextPrefs);
        if (mounted.current) setStatus(describeStatus(result));
      })
      .catch((error: unknown) => {
        if (!mounted.current) return;
        setStatus(
          error instanceof Error
            ? error.message
            : "Could not schedule reminders",
        );
      });
  }, []);

  useEffect(() => {
    mounted.current = true;
    let active = true;

    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
        if (!active) return;

        if (!stored) {
          // First visit: keep the defaults without prompting for permission.
          setLoaded(true);
          return;
        }

        const prefs = normalizePrefs(
          JSON.parse(stored) as Partial<NotificationPrefs>,
        );
        setPreferences(prefs);
        setLoaded(true);

        // Only reconcile the OS schedule when permission was already granted,
        // so opening the screen never nags for permission.
        if (isWeb || !(await hasNotificationPermission())) return;
        if (!active) return;

        queueSync(prefs);
      } catch (error) {
        console.error("Failed to load notification preferences:", error);
        if (active) setLoaded(true);
      }
    };

    load();

    return () => {
      active = false;
      mounted.current = false;
    };
  }, [queueSync]);

  const toggle = (key: keyof NotificationPrefs) => {
    const nextPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(nextPrefs);

    AsyncStorage.setItem(
      NOTIFICATION_PREFS_KEY,
      JSON.stringify(nextPrefs),
    ).catch((error) => {
      console.error("Failed to save notification preferences:", error);
    });

    queueSync(nextPrefs);
  };

  const handleTest = async () => {
    if (isWeb || testing) return;

    setTesting(true);
    try {
      const result = await scheduleTestNotification();
      if (mounted.current) {
        setStatus(describeStatus(result, "Test notification sent"));
      }
    } finally {
      if (mounted.current) setTesting(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.push("/");
    }
  };

  const renderSwitch = (key: keyof NotificationPrefs) => (
    <Switch
      value={preferences[key]}
      onValueChange={() => toggle(key)}
      disabled={isWeb || !loaded}
      trackColor={{ false: colors.muted, true: colors.primary }}
      thumbColor={colors.primaryForeground}
    />
  );

  return (
    <ThemeView className="pt-8 px-10 flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between w-full">
          <View className="border-2 overflow-hidden border-border rounded-full">
            <Pressable
              android_disableSound
              android_ripple={{
                color: colors.subtle,
                radius: 20,
              }}
              className="p-2"
              onPress={handleBack}
            >
              <Icon source="chevron-left" size={25} color={colors.foreground} />
            </Pressable>
          </View>
          <ThemeText className="text-2xl text-center font-semibold absolute left-1/2 -translate-x-1/2">
            {t("notifications.title")}
          </ThemeText>
        </View>

        <ThemeText className="text-base mt-6 text-subtle">
          {t("notifications.subtitle")}
        </ThemeText>

        {status ? (
          <ThemeText className="text-xs mt-3 text-subtle">{status}</ThemeText>
        ) : null}

        {isWeb ? (
          <ThemeText className="text-sm mt-4 text-subtle">
            Notifications are not supported in the web build. Open the app on
            iOS or Android to receive reminders.
          </ThemeText>
        ) : null}

        <SettingsItem
          icon="water-outline"
          title={t("notifications.water")}
          showChevron={false}
          rightElement={renderSwitch("water")}
        />
        <SettingsItem
          icon="fire"
          title={t("notifications.streak")}
          showChevron={false}
          rightElement={renderSwitch("streak")}
        />
        <SettingsItem
          icon="dumbbell"
          title={t("notifications.workout")}
          showChevron={false}
          rightElement={renderSwitch("workout")}
        />
        <SettingsItem
          icon="chart-box-outline"
          title={t("notifications.weeklyReport")}
          showChevron={false}
          rightElement={renderSwitch("weeklyReport")}
        />

        <SettingsItem
          icon="bell-outline"
          title="Test notification"
          onPress={isWeb ? undefined : handleTest}
          showChevron={!isWeb}
          rightElement={
            testing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : undefined
          }
        />
        <ThemeText className="text-sm mt-3 text-subtle">
          Sends a notification right now so you can check that reminders work on
          this device.
        </ThemeText>

        <ThemeText className="text-sm mt-8 text-subtle">
          Reminders are scheduled on this device. Turning one off cancels its
          notifications; turning it back on schedules them again.
        </ThemeText>
      </ScrollView>
    </ThemeView>
  );
}
