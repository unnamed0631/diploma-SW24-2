import React from "react";
import { Circle, Group, Path, Skia } from "@shopify/react-native-skia";
import { SharedValue, useDerivedValue } from "react-native-reanimated";
import { useAppTheme } from "@/lib/theme";

type Props = {
  cx: SharedValue<number>;
  cy: SharedValue<number>;
  chartHeight: number;
};

const Cursor = ({ cx, cy, chartHeight }: Props) => {
  const { colors } = useAppTheme();

  const path = useDerivedValue(() => {
    const matrix = Skia.Matrix();
    matrix.translate(cx.value, cy.value);

    const linePath = Skia.PathBuilder.Make()
      .moveTo(0, 0)
      .lineTo(0, chartHeight - cy.value - 20)
      .transform(matrix)
      .detach();

    return Skia.Path.Dash(linePath, 10, 10, 0) ?? linePath;
  });

  return (
    <Group>
      <Path
        path={path}
        color={colors.primary}
        style="stroke"
        strokeJoin="round"
        strokeWidth={2}
      />
      <Circle
        r={10}
        cx={cx}
        cy={cy}
        strokeWidth={10}
        color={colors.primarySoft}
        style={"stroke"}
      />
      <Circle r={5} cx={cx} cy={cy} color={colors.accent} style={"fill"} />
    </Group>
  );
};

export default Cursor;
