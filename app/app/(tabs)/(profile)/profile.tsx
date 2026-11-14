import { Avatar, ThemeText } from "@/components";
import { use, useCallback, useRef, useState } from "react";
import { FlatList, LayoutChangeEvent, Pressable, View } from "react-native";
import Tab1 from "@/components/profile/tab1";
import Tab2 from "@/components/profile/tab2";
import Tab3 from "@/components/profile/tab3";
import { useTranslation } from "@/lib/language";
import { useNavigation, useRouter } from "expo-router";
import { Icon } from "react-native-paper";
import { useAppTheme } from "@/lib/theme";
import { AuthContext } from "@/context/auth";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStatsStore } from "@/stores/statsStore";

type TabButtonProps = {
  children: string;
  selected: boolean;
  onPress: () => void;
};

const TabButton = ({ children, selected, onPress }: TabButtonProps) => (
  <View
    className={`flex-1 overflow-hidden ${
      selected ? "bg-primary rounded-full h-9" : ""
    }`}
  >
    <Pressable
      android_ripple={{
        color: "#00000020",
        radius: 40,
      }}
      onPress={onPress}
      className="flex-1 justify-center items-center"
    >
      <ThemeText
        variant={selected ? "inverse" : "muted"}
        className={`${selected ? "font-bold" : ""}`}
      >
        {children}
      </ThemeText>
    </Pressable>
  </View>
);

const Tabs = () => {
  const { t } = useTranslation();
  const tabRef = useRef<FlatList>(null);
  const [width, setWidth] = useState<number>(0);
  const [selectedTab, setselectedTab] = useState<number>(0);
  const tabs = [
    {
      key: "1",
      component: Tab1,
    },
    {
      key: "2",
      component: Tab2,
    },
    {
      key: "3",
      component: Tab3,
    },
  ];

  const renderItem = useCallback(
    ({ item }: { item: { key: string; component: React.ComponentType } }) => (
      <View
        style={{
          width: width,
          minHeight: 400,
          height: "auto",
          paddingBottom: 100,
        }}
        key={item.key}
      >
        <item.component />
      </View>
      //ene hesgiin unduriig uur hun ashiglah uyd ni tengis zasna geseen utsandaa taaruulad 350 iig uurchlurui ahh
    ),
    [width],
  );

  const scrollTo = (index: number) => {
    if (tabRef.current && index >= 0 && index < tabs.length) {
      requestAnimationFrame(() => {
        tabRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0,
          viewOffset: 0,
        });
      });
    }
  };

  const setDimensions = useCallback((e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  }, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width],
  );

  const handleTabPress = (tab: number) => {
    scrollTo(tab);
    setselectedTab(tab);
  };

  return (
    <View className="flex-1 w-[85%] my-2" onLayout={setDimensions}>
      <View className="flex-row justify-between w-full items-center h-10 bg-primary-soft px-1 rounded-full">
        <TabButton
          selected={selectedTab === 0}
          onPress={() => handleTabPress(0)}
        >
          {t("profile1.timeline")}
        </TabButton>
        <TabButton
          selected={selectedTab === 1}
          onPress={() => handleTabPress(1)}
        >
          {t("profile1.stats")}
        </TabButton>
        <TabButton
          selected={selectedTab === 2}
          onPress={() => handleTabPress(2)}
        >
          {t("profile1.duels")}
        </TabButton>
      </View>
      <FlatList
        ref={tabRef}
        initialScrollIndex={0}
        data={tabs}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        nestedScrollEnabled={true}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        removeClippedSubviews={false}
        maxToRenderPerBatch={3}
        windowSize={3}
        initialNumToRender={1}
      />
    </View>
  );
};

export default function Profile() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.push("/");
    }
  };
  const { user } = use(AuthContext);
  const { calories: todayCalories } = useStatsStore();

  // `totalCalories` is returned by the API but isn't part of the local `User`
  // type yet, so read it through an intersection instead of `any`.
  const userTotalCalories = (user as (User & { totalCalories?: number }) | null)
    ?.totalCalories;
  const hasTotalCalories = typeof userTotalCalories === "number";
  const caloriesValue = hasTotalCalories ? userTotalCalories : todayCalories;

  const handlePfp = () => {
    router.push("/(settings)/Edit");
  };

  return (
    <SafeAreaView className="items-center justify-center bg-background flex-1">
      <View className="flex-row items-center px-6 justify-between w-full mt-5">
        <View className="border-2 border-border overflow-hidden rounded-full">
          <Pressable
            android_ripple={{ color: "#00000020", radius: 40 }}
            onPress={handleBack}
            className="p-2"
          >
            <Icon source="chevron-left" size={25} color={colors.foreground} />
          </Pressable>
        </View>
        <ThemeText className="text-2xl text-center font-semibold">
          {t("profile1.title")}
        </ThemeText>
        <Pressable
          className="border-2 border-border p-2 rounded-full"
          onPress={() => router.push("/settings")}
        >
          <Icon source="cog-outline" size={25} color={colors.foreground} />
        </Pressable>
      </View>
      <Pressable
        className="items-center justify-center mt-5"
        onPress={handlePfp}
      >
        <Avatar />
      </Pressable>
      <ThemeText className="text-2xl font-bold mt-2">
        {user?.username}
        {/* Gerelt-Od */}
      </ThemeText>
      <View className="flex-row items-center justify-between w-1/2 my-4">
        <View className="items-center">
          <Icon source="flash-outline" color={colors.foreground} size={30} />
          <ThemeText className="font-semibold text-xl">
            {caloriesValue}
          </ThemeText>
          <ThemeText className="text-subtle">
            {hasTotalCalories ? t("profile1.calories") : "Today's Calories"}
          </ThemeText>
        </View>
        <View className="items-center">
          <Icon source="account-outline" color={colors.foreground} size={30} />
          <ThemeText className="font-semibold text-xl">—</ThemeText>
          <ThemeText className="text-subtle">
            {t("profile1.followers")}
          </ThemeText>
        </View>
      </View>
      <ThemeText className="text-xs text-subtle text-center px-8 mb-2">
        Followers and social features aren&apos;t available yet.
      </ThemeText>
      <Tabs />
    </SafeAreaView>
  );
}
