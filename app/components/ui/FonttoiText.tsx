import { Text } from "react-native";
import type { ComponentProps, ReactNode } from "react";
import { hasExplicitTextColor, themeTextClasses } from "./ThemeText";
import type { ThemeTextVariant } from "./ThemeText";

export interface FonttoiTextProps extends ComponentProps<typeof Text> {
  children?: ReactNode;
  className?: string;
  variant?: ThemeTextVariant;
}

/**
 * Quicksand text with the same semantic colour variants as `ThemeText`.
 * Kept as a separate component because most call sites rely on the font.
 */
export default function FonttoiText({
  className,
  variant = "default",
  ...props
}: FonttoiTextProps) {
  const colorClass = hasExplicitTextColor(className)
    ? ""
    : themeTextClasses[variant];

  return (
    <Text
      style={{ fontFamily: "Quicksand" }}
      className={`font-quicksand ${colorClass} ${className ?? ""}`.trim()}
      {...props}
    />
  );
}
