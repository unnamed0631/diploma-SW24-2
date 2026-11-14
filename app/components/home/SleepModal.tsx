import { useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { X } from "lucide-react-native";
import { ThemeView } from "@/components";
import { useTranslation } from "@/lib/language";
import { useAppTheme } from "@/lib/theme";
import { useStatsStore } from "@/stores/statsStore";

type PickerTarget = "start" | "end";

const formatMinutes = (minutes: number) => {
  const safeMinutes = Math.max(0, Math.round(minutes));
  return `${Math.floor(safeMinutes / 60)}h ${safeMinutes % 60}m`;
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function SleepModal({
  visible,
  setVisible,
}: {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { t } = useTranslation();
  const { theme, colors } = useAppTheme();
  const { sleep, sleepGoal, setField } = useStatsStore();

  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  const [activePicker, setActivePicker] = useState<PickerTarget | null>(null);

  // Seed the pickers from the stored value (or 8h) every time the sheet opens.
  const handleShow = () => {
    const storedSleep = useStatsStore.getState().sleep;
    const end = new Date();
    const start = new Date(
      end.getTime() - (storedSleep > 0 ? storedSleep : 8 * 60) * 60000,
    );
    setStartTime(start);
    setEndTime(end);
    setActivePicker(null);
  };

  const sleepMinutes = useMemo(() => {
    const start = startTime.getHours() * 60 + startTime.getMinutes();
    const end = endTime.getHours() * 60 + endTime.getMinutes();
    const diff = end - start;
    // Bedtime after wake-up time means the sleep crossed midnight.
    return diff >= 0 ? diff : diff + 24 * 60;
  }, [startTime, endTime]);

  const handleTimeChange = (
    target: PickerTarget,
    event: DateTimePickerEvent,
    date?: Date,
  ) => {
    if (Platform.OS !== "ios") {
      // Android renders the picker as a dialog; close it after a selection.
      setActivePicker(null);
    }
    if (event.type === "dismissed" || !date) {
      return;
    }
    if (target === "start") {
      setStartTime(date);
    } else {
      setEndTime(date);
    }
  };

  const handleSave = async () => {
    await setField("sleep", sleepMinutes);
    setVisible(false);
  };

  const timeBoxClass = "flex-1 p-4 border border-border rounded-2xl bg-card";
  const timeLabelClass = "text-sm font-semibold text-subtle mb-1";
  const timeValueClass = "text-lg font-semibold text-foreground";

  return (
    <Modal
      visible={visible}
      onRequestClose={() => setVisible(false)}
      onShow={handleShow}
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
          <Text className="text-2xl font-bold text-center mt-4 mb-8 text-foreground">
            {t("sleep.sleep")}
          </Text>

          <View className="w-full flex-row justify-between gap-4">
            <Pressable
              className={timeBoxClass}
              onPress={() => setActivePicker("start")}
            >
              <Text className={timeLabelClass}>Sleep start</Text>
              <Text className={timeValueClass}>{formatTime(startTime)}</Text>
            </Pressable>

            <Pressable
              className={timeBoxClass}
              onPress={() => setActivePicker("end")}
            >
              <Text className={timeLabelClass}>Sleep end</Text>
              <Text className={timeValueClass}>{formatTime(endTime)}</Text>
            </Pressable>
          </View>

          {activePicker && (
            <View className="w-full items-center mt-4">
              <DateTimePicker
                value={activePicker === "start" ? startTime : endTime}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                themeVariant={theme}
                onChange={(event, date) =>
                  handleTimeChange(activePicker, event, date)
                }
              />
              {Platform.OS === "ios" && (
                <Pressable
                  className="mt-2 p-2"
                  onPress={() => setActivePicker(null)}
                >
                  <Text className="text-base font-semibold text-primary">
                    Done
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          <Text className="text-center text-2xl font-bold text-primary mt-8">
            {formatMinutes(sleepMinutes)}
          </Text>

          <View className="w-full p-4 mt-6 rounded-2xl border border-border bg-card">
            <View className="flex-row justify-between items-center">
              <Text className="text-base text-muted-foreground">Current</Text>
              <Text className="text-base font-semibold text-foreground">
                {formatMinutes(sleep)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-base text-muted-foreground">Goal</Text>
              <Text className="text-base font-semibold text-foreground">
                {formatMinutes(sleepGoal)}
              </Text>
            </View>
          </View>

          <Pressable
            className="w-full bg-primary rounded-2xl py-4 mt-6"
            onPress={handleSave}
          >
            <Text className="text-center text-primary-foreground font-bold text-base">
              Save
            </Text>
          </Pressable>
        </ScrollView>
      </ThemeView>
    </Modal>
  );
}

export default SleepModal;
