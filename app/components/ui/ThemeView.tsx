import { StyleProp, View, ViewProps, ViewStyle } from "react-native";

type ThemeViewProps = ViewProps & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Semantic surface. Defaults to the app canvas (`bg-background`); use
   * `card` for raised surfaces and `muted` for inset wells.
   */
  surface?: "background" | "card" | "muted" | "none";
};

const surfaceClasses = {
  background: "bg-background",
  card: "bg-card",
  muted: "bg-muted",
  none: "",
} as const;

const ThemeView = ({
  children,
  className,
  surface = "background",
  ...props
}: ThemeViewProps) => {
  return (
    <View
      {...props}
      className={`${surfaceClasses[surface]} flex-1 ${className ?? ""}`}
    >
      {children}
    </View>
  );
};

export default ThemeView;
