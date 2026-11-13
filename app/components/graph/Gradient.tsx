import React from "react";
import { LinearGradient, Path, Skia } from "@shopify/react-native-skia";
import { SharedValue } from "react-native-reanimated";

type Props = {
  chartHeight: number;
  chartWidth: number;
  chartMargin: number;
  curvedLine: string;
  animationGradient: SharedValue<{ x: number; y: number }>;
};

const Gradient = ({
  chartHeight,
  chartWidth,
  chartMargin,
  curvedLine,
  animationGradient,
}: Props) => {
  const getGradientArea = (
    chartLine: string,
    width: number,
    height: number,
  ) => {
    const sourcePath = Skia.Path.MakeFromSVGString(chartLine);
    if (!sourcePath) {
      return null;
    }

    const builder = Skia.PathBuilder.Make();
    builder.addPath(sourcePath);
    builder.lineTo(width - chartMargin, height);
    builder.lineTo(chartMargin, height);
    builder.lineTo(chartMargin, sourcePath.getPoint(0).y);

    return builder.detach();
  };
  return (
    <Path path={getGradientArea(curvedLine!, chartWidth, chartHeight)!}>
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={animationGradient}
        colors={["#4C91F9", "rgba(76, 145, 249, 0)"]}
      />
    </Path>
  );
};

export default Gradient;
