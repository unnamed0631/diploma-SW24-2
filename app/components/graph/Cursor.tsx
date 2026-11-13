import React from "react";
import { Circle, Group, Path, Skia } from "@shopify/react-native-skia";
import { SharedValue, useDerivedValue } from "react-native-reanimated";

type Props = {
  cx: SharedValue<number>;
  cy: SharedValue<number>;
  chartHeight: number;
};

const Cursor = ({ cx, cy, chartHeight }: Props) => {
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
        color="#4C91F9"
        style="stroke"
        strokeJoin="round"
        strokeWidth={2}
      />
      <Circle
        r={10}
        cx={cx}
        cy={cy}
        strokeWidth={10}
        color={"#F4E2E2"}
        style={"stroke"}
      />
      <Circle r={5} cx={cx} cy={cy} color={"#FF6079"} style={"fill"} />
    </Group>
  );
};

export default Cursor;
