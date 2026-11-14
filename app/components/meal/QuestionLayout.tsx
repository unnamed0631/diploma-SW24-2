import React from "react";
import { View, StyleSheet } from "react-native";
import { useAppTheme } from "@/lib/theme";
import ProgressBar from "./ProgressBar";

interface QuestionLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps?: number;
}

export default function QuestionLayout({
  children,
  currentStep,
  totalSteps = 5,
}: QuestionLayoutProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "flex-start",
    alignItems: "center",
  },
});
