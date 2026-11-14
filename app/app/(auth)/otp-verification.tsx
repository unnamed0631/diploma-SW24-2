import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useAppTheme } from "@/lib/theme";
import { BlurEllipse } from "@/components";

const OTPVerification = () => {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [otp, setOtp] = useState("");

  const handleVerify = () => {
    if (otp.length === 4) {
      router.push("/(auth)/password-changed");
    } else {
      alert("Please enter a valid 4-digit code.");
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      {/* <BlurEllipse /> */}
      {/* 🔙 Back button */}
      <View className="flex-row items-center px-4 pt-12 z-50">
        <Pressable
          onPress={handleBack}
          className="w-10 h-10 bg-card items-center justify-center shadow rounded-md"
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
      </View>

      {/* 📩 Main content */}
      <View className="flex-1 items-center justify-start px-6 mt-16">
        <BlurEllipse />
        <Text className="text-[3.50rem] font-bold text-foreground mb-2">
          OTP Verification
        </Text>

        <Text className="text-base text-center text-muted-foreground mb-6 px-2">
          Enter the verification code we just sent on your email address.
        </Text>

        <TextInput
          placeholder="••••"
          keyboardType="numeric"
          maxLength={4}
          className="w-1/2 text-center text-xl tracking-widest bg-muted text-foreground rounded-xl px-4 py-4 mb-10"
          placeholderTextColor={colors.mutedForeground}
          onChangeText={setOtp}
          value={otp}
        />

        <TouchableOpacity
          className="w-full bg-primary py-4 rounded-full mb-6"
          onPress={handleVerify}
        >
          <Text className="text-center text-primary-foreground font-bold">
            Verify Code
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🔁 Bottom section */}
      <View className="items-center mb-6">
        <Text className="text-sm text-muted-foreground">
          Didn’t receive code?{" "}
          <Text className="font-semibold text-primary">Resend</Text>
        </Text>
      </View>
    </View>
  );
};

export default OTPVerification;
