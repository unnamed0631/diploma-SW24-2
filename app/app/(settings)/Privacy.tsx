import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRouter } from "expo-router";
import React, { use, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { Icon } from "react-native-paper";
import { ThemeText, ThemeView } from "@/components";
import { AuthContext } from "@/context/auth";
import { useTranslation } from "@/lib/language";
import { useAppTheme } from "@/lib/theme";

// Keys written by the app itself. Auth tokens live in SecureStore on native
// devices, so they are cleared through `logout()` as well.
const APP_STORAGE_KEYS = [
  "accessToken",
  "refreshToken",
  "language",
  "app-theme",
  "app-notifications",
  "appStatsStore",
  "dailyTasks",
  "lastGeneratedDate",
  "streakIncrementedToday",
  "bookMarks",
  "bookmarkedPosts",
];

export default function Privacy() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const { user, logout } = use(AuthContext);
  const [isClearing, setIsClearing] = useState(false);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.push("/");
    }
  };

  const clearLocalData = async () => {
    setIsClearing(true);
    try {
      await AsyncStorage.multiRemove(APP_STORAGE_KEYS);
      if (user) {
        // Also wipes the tokens kept in SecureStore and clears the in-memory
        // session, so the profile guard sends the user back to login.
        await logout();
        router.replace("/(tabs)/(profile)");
      }
      Alert.alert(t("privacy.clearedTitle"), t("privacy.clearedMessage"));
    } catch (error) {
      console.error("Failed to clear local data:", error);
      Alert.alert(t("privacy.clearErrorTitle"), t("privacy.clearErrorMessage"));
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      t("privacy.clearConfirmTitle"),
      t("privacy.clearConfirmMessage"),
      [
        { text: t("privacy.cancel"), style: "cancel" },
        {
          text: t("privacy.clearConfirm"),
          style: "destructive",
          onPress: clearLocalData,
        },
      ],
    );
  };

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
            {t("privacy.title")}
          </ThemeText>
        </View>

        <ThemeText className="text-xl font-semibold mt-8">
          {t("privacy.policyTitle")}
        </ThemeText>
        <ThemeText className="text-base mt-3 text-muted-foreground leading-6">
          {t("privacy.policy1")}
        </ThemeText>
        <ThemeText className="text-base mt-3 text-muted-foreground leading-6">
          {t("privacy.policy2")}
        </ThemeText>

        <ThemeText className="text-xl font-semibold mt-8">
          {t("privacy.termsTitle")}
        </ThemeText>
        <ThemeText className="text-base mt-3 text-muted-foreground leading-6">
          {t("privacy.terms1")}
        </ThemeText>
        <ThemeText className="text-base mt-3 text-muted-foreground leading-6">
          {t("privacy.terms2")}
        </ThemeText>

        <Pressable
          className="mt-10 flex-row items-center justify-center border border-destructive rounded-full py-4"
          onPress={handleClearData}
          disabled={isClearing}
        >
          {isClearing ? (
            <ActivityIndicator size="small" color={colors.destructive} />
          ) : (
            <>
              <Icon
                source="delete-outline"
                size={22}
                color={colors.destructive}
              />
              <ThemeText className="text-lg font-semibold text-destructive ml-2">
                {t("privacy.clearTitle")}
              </ThemeText>
            </>
          )}
        </Pressable>
        <ThemeText className="text-sm mt-3 text-subtle">
          {t("privacy.clearDesc")}
        </ThemeText>
      </ScrollView>
    </ThemeView>
  );
}
