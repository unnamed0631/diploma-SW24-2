// mnkv.tsx

import { ThemeView } from "@/components";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "@/context/auth";
import { useTranslation } from "@/lib/language";

const Mnkv = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = React.useContext(AuthContext);

  const handleNext = () => {
    router.push("/(meal)/asuult");
  };

  return (
    <ThemeView className="flex-1 justify-end items-center p-6 pb-36">
      <View className="w-full">
        <View className="flex-row">
          <Text
            className="text-3xl font-bold text-foreground"
            style={{ paddingLeft: 20 }}
          >
            {t("mnkv.hello")}
          </Text>
          <Text
            className="text-3xl font-bold text-foreground"
            style={{ paddingLeft: 20 }}
          >
            {user?.username} !
          </Text>
        </View>
        <Text
          className="text-base mt-4 text-muted-foreground"
          style={{ paddingLeft: 20 }}
        >
          {t("mnkv.text")}
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleNext}
        className="w-[90%] h-14 bg-primary rounded-full items-center justify-center mt-10"
      >
        <Text className="text-primary-foreground font-bold text-lg">
          {t("mnkv.continue")}
        </Text>
      </TouchableOpacity>
    </ThemeView>
  );
};

export default Mnkv;
