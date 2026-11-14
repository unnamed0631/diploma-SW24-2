import { View, Text, Pressable, Switch } from "react-native";
import { Bookmark, X, Sun, Star } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeView, ThemeText } from "@/components";
import { ImageBackground } from "expo-image";
import { useTranslation } from "@/lib/language";
import { Button } from "react-native-paper";
import { useAppTheme } from "@/lib/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { use, useMemo, useState } from "react";
import { AuthContext } from "@/context/auth";
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
  interpolate,
} from "react-native-reanimated";

const IMAGE_HEIGHT = 320;

function Screen1() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const { workouts } = use(AuthContext);
  const plan = useMemo(() => (workouts ?? []) as IExercise[], [workouts]);
  const workout = useMemo(() => {
    if (plan.length === 0) return null;
    if (id) {
      const match = plan.find((item) => String(item.id) === String(id));
      if (match) return match;
    }
    return plan[0];
  }, [id, plan]);

  const equipment = useMemo(() => {
    const raw = workout?.equipment?.trim();
    if (!raw || raw.toLowerCase() === "none") return ["None"];
    return raw
      .split(/[,/]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, [workout]);

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);
  const deedHeight = 500 + insets.top;
  const [switchStates, setSwitchStates] = useState<Record<string, boolean>>({});
  const toggleSwitch = (key: string) =>
    setSwitchStates((previous) => ({ ...previous, [key]: !previous[key] }));

  const deedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollOffset.value,
          [0, deedHeight / 2, deedHeight],
          [0, -150, -200],
        ),
      },
    ],
  }));

  const deedContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollOffset.value, [0, deedHeight / 2], [1, 0]),
  }));

  if (!workout) {
    return (
      <ThemeView className="flex-1">
        <View
          className="flex-row items-center justify-between px-6"
          style={{ paddingTop: insets.top + 16 }}
        >
          <ThemeText className="text-2xl font-bold">
            {t("training.workout")}
          </ThemeText>
          <Pressable
            className="p-3 rounded-2xl"
            style={{ backgroundColor: colors.muted }}
            onPress={() => router.back()}
          >
            <X size={20} color={colors.foreground} />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-xl font-bold text-center text-foreground">
            No workout plan yet
          </Text>
          <Text className="text-sm text-center mt-2 text-muted-foreground">
            Pick a planned workout from the training list or create your own
            custom session.
          </Text>
          <Pressable
            className="mt-6 bg-primary rounded-xl px-6 py-3"
            onPress={() => router.push("/home/training/screen2")}
          >
            <Text className="text-primary-foreground font-semibold">
              {t("training.custom")}
            </Text>
          </Pressable>
        </View>
      </ThemeView>
    );
  }

  return (
    //  <SafeAreaView className="flex-1">
    <ThemeView className="flex-1 relative pt-[100px]">
      <View
        className="flex-row items-center gap-3 absolute right-4 z-10"
        style={{ paddingTop: insets.top }}
      >
        <Pressable
          className="p-4 rounded-2xl"
          style={{ backgroundColor: colors.muted }}
          onPress={() => router.back()}
        >
          <X size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <Animated.View
        style={[deedStyle, { height: IMAGE_HEIGHT }]}
        className="absolute top-0 left-0 right-0 w-full"
      >
        <ImageBackground
          source={require("@/assets/img/lightEffect.jpg")}
          style={{
            width: "100%",
            height: "100%",
            padding: 12,
            paddingTop: insets.top,
            paddingHorizontal: 25,
          }}
        >
          <Animated.View style={[deedContentStyle]} className="flex-1">
            <View className="flex-row items-center justify-between">
              <View className="p-2 bg-primary rounded-full items-center">
                <Text className="text-primary-foreground text-[11px] font-semibold p-1">
                  {t("training.special")}
                </Text>
              </View>
            </View>
            <ThemeText className="text-5xl font-bold text-white mt-9 font-quicksand">
              {workout.duration_minutes} min
            </ThemeText>
            <ThemeText className="text-2xl font-semibold text-white mt-1 font-quicksand">
              {workout.name}
            </ThemeText>
            <View className="flex-row items-center mt-4 gap-3">
              <Sun size={15} color="white" />
              <ThemeText className="text-white font-quicksand">
                {workout.level}
              </ThemeText>
            </View>
            <View className="flex-row items-center mt-4 gap-3">
              <Star size={15} color="white" />
              <ThemeText className="text-white font-quicksand">
                {workout.category}
              </ThemeText>
            </View>
          </Animated.View>
        </ImageBackground>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollRef}
        style={{ paddingTop: IMAGE_HEIGHT - 100 }}
      >
        <Animated.View
          className="rounded-3xl z-10 p-6"
          style={{
            backgroundColor: colors.card,
            minHeight: 1200,
          }}
        >
          <View
            className="flex-row items-center py-4 justify-between mt-4 border-b"
            style={{ borderColor: colors.border }}
          >
            <ThemeText className="font-bold text-lg font-quicksand">
              {t("training.aud")}
            </ThemeText>
            <ThemeText className="font-bold text-lg font-quicksand">
              {t("training.hugjim")}
            </ThemeText>
          </View>

          <View className="flex-row items-center mt-14 gap-3">
            <Bookmark size={18} color={colors.mutedForeground} />
            <ThemeText className="uppercase text-sm font-bold font-quicksand">
              {t("training.dasgal")}
            </ThemeText>
          </View>

          <ThemeText
            className="mt-4 font-quicksand"
            style={{ color: colors.mutedForeground }}
          >
            {workout.description}
          </ThemeText>

          <ThemeText
            className="uppercase mt-14"
            style={{ color: colors.mutedForeground }}
          >
            {t("training.need")}
          </ThemeText>

          <View className="flex-row flex-wrap mt-4 gap-4 font-quicksand">
            {equipment.map((item, i) => (
              <View
                key={`${item}-${i}`}
                className="py-8 px-4 rounded-2xl"
                style={{ backgroundColor: colors.muted }}
              >
                <ThemeText className="font-semibold">{item}</ThemeText>
              </View>
            ))}
          </View>

          <ThemeText
            className="uppercase mt-14 font-quicksand"
            style={{ color: colors.mutedForeground }}
          >
            {t("training.hiih")}
          </ThemeText>

          {[
            { title: "Warm-Up", time: "+3min" },
            { title: "Cooldown", time: "+5min" },
          ].map(({ title, time }) => (
            <View
              key={title}
              className="flex-row items-center justify-between mt-4 border-b"
              style={{ borderColor: colors.border }}
            >
              <View className="flex-row items-center gap-1 py-4">
                <ThemeText className="text-2xl font-bold">{title}</ThemeText>
                <ThemeText className="text-xl text-purple-400">
                  ({time})
                </ThemeText>
              </View>
              <Switch
                value={!!switchStates[title]}
                onValueChange={() => toggleSwitch(title)}
                thumbColor={switchStates[title] ? colors.primary : colors.muted}
                trackColor={{
                  false: colors.muted,
                  true: colors.primarySoft,
                }}
              />
            </View>
          ))}
        </Animated.View>
      </Animated.ScrollView>

      <View className="absolute bottom-5 left-5 right-5">
        <Pressable onPress={() => router.push("/home/training/screen2")}>
          <Button
            mode="contained"
            className="rounded-xl"
            textColor={colors.foreground}
            contentStyle={{
              paddingVertical: 12,
              backgroundColor: colors.muted,
            }}
          >
            {t("start.later")}
          </Button>
        </Pressable>
      </View>
      <View className="absolute bottom-28 left-5 right-5">
        <Pressable onPress={() => router.push("/home/training/start")}>
          <Button
            mode="contained"
            className="rounded-xl bg-primary"
            contentStyle={{
              paddingVertical: 12,
              backgroundColor: colors.primary,
            }}
          >
            {t("start.start")}
          </Button>
        </Pressable>
      </View>
    </ThemeView>
    // </SafeAreaView>
  );
}

export default Screen1;
