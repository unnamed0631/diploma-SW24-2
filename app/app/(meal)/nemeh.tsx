import { View, Text, Pressable, TextInput } from "react-native";
import React, { useState } from "react";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useTranslation } from "@/lib/language";
import { useAppTheme } from "@/lib/theme";

export default function Meal() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  const [selectedTab, setSelectedTab] = useState<"recent" | "favorites">(
    "recent",
  );
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({
    "English breakfast": false,
    "Egg omlete": false,
  });

  const meals = [
    { date: "Өнөөдөр", title: "English breakfast", calories: "120/304 kcal" },
    { date: "Өчигдөр", title: "Egg omlete", calories: "120/304 kcal" },
  ];

  const toggleFavorite = (title: string) => {
    setFavorites((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const renderMealCard = (title: string, calories: string) => (
    <View
      key={title}
      className="border border-border rounded-2xl px-5 py-4 mb-4 flex-row justify-between items-center"
    >
      <View>
        <Text className="font-bold text-lg text-foreground">{title}</Text>
        <Text className="text-sm text-subtle">{calories}</Text>
      </View>
      <Pressable onPress={() => toggleFavorite(title)}>
        {favorites[title] ? (
          <MaterialIcons name="favorite" size={24} color={colors.destructive} />
        ) : (
          <Feather name="heart" size={22} color={colors.foreground} />
        )}
      </Pressable>
    </View>
  );

  const scannerImages = [
    { label: t("breakfast.barcode"), source: require("@/assets/barcode.png") },
    { label: t("breakfast.menu"), source: require("@/assets/Menu.png") },
    { label: t("breakfast.Fridge"), source: require("@/assets/fridge.png") },
  ];

  return (
    <View className="p-6 pt-8 bg-background flex-1">
      {/* Header */}
      <View className="flex-row justify-between items-center">
        <Feather name="plus" size={20} color={colors.foreground} />
        <Text className="font-bold text-xl text-foreground">
          {t("breakfast.title")}
        </Text>
        <View className="overflow-hidden">
          <Pressable
            onPress={() => router.back()}
            android_ripple={{ color: "#DDDDDDD", radius: 30 }}
            android_disableSound
            className="p-2 rounded-full bg-muted overflow-hidden"
          >
            <Text className="font-bold text-lg text-primary">
              {t("breakfast.button")}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Search */}
      <View className="flex-row items-center mt-5">
        <View className="flex-row flex-1 items-center px-4 py-2 border border-border rounded-full bg-card">
          <View className="w-8 h-8 rounded-full justify-center items-center mr-2">
            <Feather name="search" size={18} color={colors.mutedForeground} />
          </View>
          <TextInput
            placeholder={t("breakfast.search")}
            placeholderTextColor={colors.subtle}
            clearButtonMode="always"
            autoCapitalize="none"
            autoCorrect={false}
            numberOfLines={1}
            className="flex-1 py-1 text-foreground"
          />
        </View>
        <Pressable className="ml-3 w-12 h-12 rounded-full bg-foreground justify-center items-center border border-border">
          <Feather name="mic" size={16} color={colors.background} />
        </Pressable>
      </View>

      {/* Buttons */}
      <View className="flex-row justify-between items-center mt-5">
        <Pressable className="p-3 w-[47%] border border-border rounded-full justify-center items-center">
          <Text className="text-base font-bold text-foreground">
            {t("breakfast.gar")}
          </Text>
        </Pressable>
        <Pressable className="p-3 w-[47%] border border-border rounded-full justify-center items-center">
          <Text className="text-base font-bold text-foreground">
            {t("breakfast.orts")}
          </Text>
        </Pressable>
      </View>

      {/* Scan Button */}
      <Pressable
        className="w-full p-3 bg-primary rounded-full justify-center items-center mt-5"
        onPress={() => router.push("/(meal)/imageScan")}
      >
        <Text className="text-base text-primary-foreground">
          {t("meal.image")}
        </Text>
      </Pressable>
      <Pressable
        className="w-full p-3 bg-primary rounded-full justify-center items-center mt-5"
        onPress={() => router.push("./scan")}
      >
        <Text className="text-base text-primary-foreground">
          {t("meal.barcode")}
        </Text>
      </Pressable>

      {/* More Scanners */}
      <Text className="text-lg font-bold mt-6 text-foreground">
        {t("breakfast.more")}
      </Text>
      <View className="flex-row items-center mt-5 gap-4">
        {scannerImages.map((item, i) => (
          <View className="justify-center items-center" key={i}>
            <View className="w-20 h-20 bg-primary-soft border border-primary rounded-2xl justify-center items-center">
              <Image
                source={item.source}
                style={{ width: "60%", height: "60%" }}
              />
            </View>
            <Text className="mt-1 font-bold text-foreground text-sm">
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View className="flex-row justify-center mt-8 mb-2 space-x-8">
        {[t("breakfast.recent"), t("breakfast.favorites")].map((tab, index) => {
          const active =
            (selectedTab === "recent" && index === 0) ||
            (selectedTab === "favorites" && index === 1);
          return (
            <Pressable
              key={index}
              className="flex-1 items-center"
              onPress={() =>
                setSelectedTab(index === 0 ? "recent" : "favorites")
              }
            >
              <Text
                className={`text-lg font-bold ${
                  active ? "text-primary" : "text-foreground"
                }`}
              >
                {tab}
              </Text>
              {active && (
                <View className="h-1 w-full bg-primary mt-2 rounded-full" />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Meals */}
      <View className="mt-3">
        {["Өнөөдөр", "Өчигдөр"].map((day) => {
          const dayMeals = meals.filter((meal) => meal.date === day);
          const visibleMeals =
            selectedTab === "recent"
              ? dayMeals
              : dayMeals.filter((meal) => favorites[meal.title]);

          return visibleMeals.length ? (
            <View key={day} className="mt-4">
              <Text className="text-subtle mb-2 text-sm">
                {day === "Өнөөдөр"
                  ? "Today"
                  : day === "Өчигдөр"
                    ? "Yesterday"
                    : ""}
              </Text>
              {visibleMeals.map((meal) =>
                renderMealCard(meal.title, meal.calories),
              )}
            </View>
          ) : null;
        })}
      </View>
    </View>
  );
}
