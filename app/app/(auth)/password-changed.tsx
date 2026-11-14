import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
} from "react-native";
import { useAppTheme } from "@/lib/theme";
import { BlurEllipse } from "@/components";

export default function PasswordChanged() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = () => {
    if (newPassword === confirmPassword && newPassword.length >= 6) {
      router.push("/(auth)/VerificationSuccess");
    } else {
      alert("Passwords do not match or are too short (min 6 characters).");
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      {/* 🔙 Back button */}
      <BlurEllipse />
      <View className="flex-row items-center px-4 pt-12">
        <Pressable
          onPress={handleBack}
          className="w-10 h-10 bg-card items-center justify-center shadow rounded-md"
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
      </View>

      {/* 🔐 Main content */}
      <View className="flex-1 items-center justify-start px-6 mt-16">
        <Text className="text-[3rem] font-bold text-foreground mb-2">
          Create new password
        </Text>

        <Text className="text-base text-center text-muted-foreground mb-8 px-2">
          Your new password must be unique from those previously used.
        </Text>

        <TextInput
          placeholder="Enter new password"
          secureTextEntry
          className="w-full bg-muted text-foreground rounded-full px-4 py-4 mb-4"
          placeholderTextColor={colors.mutedForeground}
          onChangeText={setNewPassword}
          value={newPassword}
        />

        <TextInput
          placeholder="Confirm new password"
          secureTextEntry
          className="w-full bg-muted text-foreground rounded-full px-4 py-4 mb-6"
          placeholderTextColor={colors.mutedForeground}
          onChangeText={setConfirmPassword}
          value={confirmPassword}
        />

        <TouchableOpacity
          className="bg-primary px-8 py-4 rounded-full w-full items-center"
          onPress={handleSubmit}
        >
          <Text className="text-primary-foreground font-bold">
            Change Password
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
