import { ThemeView } from "@/components";
import React, { use } from "react";
import { Text, View, TouchableOpacity, Platform } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { AuthContext } from "@/context/auth";
import { useTranslation } from "@/lib/language";

WebBrowser.maybeCompleteAuthSession();

const SignUp = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { loginWithGoogle, signInWithApple } = use(AuthContext);
  const handleEmail = () => router.push("/(auth)/EmailRegister");
  const LogIn = () => router.push("/(auth)/login");

  const handleGoogleSignIn = () => {
    loginWithGoogle();
  };

  return (
    <ThemeView className="flex-1 items-center justify-center">
      <Image
        source={require("@/assets/bluviSignup.png")}
        style={{ width: "55%", height: "25%" }}
        cachePolicy={"memory"}
        contentFit={"contain"}
        focusable={false}
      />
      <Text className="text-foreground text-3xl font-medium mt-3 text-center px-4">
        {t("signup.title")}
      </Text>
      {Platform.OS === "ios" && (
        <View className="w-3/4 bg-primary rounded-full items-center justify-wtart mb-2 space-x-4 mt-16 p-4 flex-row gap-4">
          <View className="">
            <Image
              source={require("@/assets/socialLogo/apple_white.png")}
              style={{ width: 28, height: 28 }}
              contentFit="contain"
            />
          </View>
          <View>
            <TouchableOpacity onPress={signInWithApple}>
              <Text className="text-primary-foreground font-semibold text-[14px]">
                {t("signup.apple")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View className="w-3/4 rounded-full border border-border items-center justify-start my-2 space-x-4 p-4 flex-row gap-4">
        <View className="">
          <Image
            source={require("@/assets/socialLogo/google.png")}
            style={{ width: 25, height: 30 }}
            contentFit="contain"
          />
        </View>
        <View>
          <TouchableOpacity onPress={handleGoogleSignIn}>
            <Text className="text-foreground font-semibold text-[14px]">
              {t("signup.google")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text className="text-subtle mt-2">{t("signup.or")}</Text>

      <TouchableOpacity
        onPress={handleEmail}
        className="w-3/4 rounded-full bg-primary items-center justify-center mb-2 space-x-4 mt-3 p-5"
      >
        <Text className="text-primary-foreground font-semibold text-md">
          {t("signup.continue")}
        </Text>
      </TouchableOpacity>
      <View className="flex-row justify-center mt-24">
        <Text className="text-foreground">{t("signup.already")} </Text>
        <Text
          className="text-primary font-semibold dark:underline"
          onPress={LogIn}
        >
          {t("signup.login")}
        </Text>
      </View>
    </ThemeView>
  );
};

export default SignUp;
