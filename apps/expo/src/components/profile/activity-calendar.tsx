import { View } from "react-native";
import Svg, { G, Rect, Text as SvgText } from "react-native-svg";

import type { Day, Theme } from "@/lib/calendar-util";
import { getMonthLabels, groupByWeeks, levelColor } from "@/lib/calendar-util";
import { useThemeColors } from "@/components/theme-colors";

/** GitHub-style heatmap — RN port of the web activity-calendar. */
const BLOCK_SIZE = 12;
const BLOCK_MARGIN = 4;
const BLOCK_RADIUS = 2;
const FONT_SIZE = 12;

type Props = {
  data: Day[];
  theme: Theme;
};

export const ActivityCalendar = ({ data, theme }: Props) => {
  const colors = useThemeColors();
  const weeks = groupByWeeks(data);
  const monthLabels = getMonthLabels(weeks);

  const textHeight = FONT_SIZE + 2 * BLOCK_MARGIN;
  const width = weeks.length * (BLOCK_SIZE + BLOCK_MARGIN) - BLOCK_MARGIN;
  const height = textHeight + (BLOCK_SIZE + BLOCK_MARGIN) * 7 - BLOCK_MARGIN;

  return (
    <View className="items-center">
      <Svg width={width} height={height}>
        <G>
          {monthLabels.map((label) => (
            <SvgText
              key={`${label.x}-${label.text}`}
              x={(BLOCK_SIZE + BLOCK_MARGIN) * label.x}
              y={FONT_SIZE}
              fontSize={FONT_SIZE}
              fill={colors.mutedForeground}
            >
              {label.text}
            </SvgText>
          ))}
        </G>
        {weeks.map((week, weekIndex) => (
          <G key={weekIndex} x={(BLOCK_SIZE + BLOCK_MARGIN) * weekIndex}>
            {week.map((day, dayIndex) =>
              day !== undefined ? (
                <Rect
                  key={day.date}
                  y={textHeight + (BLOCK_SIZE + BLOCK_MARGIN) * dayIndex}
                  width={BLOCK_SIZE}
                  height={BLOCK_SIZE}
                  rx={BLOCK_RADIUS}
                  fill={levelColor(theme, day.level)}
                />
              ) : null,
            )}
          </G>
        ))}
      </Svg>
    </View>
  );
};
