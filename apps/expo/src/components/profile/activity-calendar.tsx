import { View } from "react-native";
import Svg, { G, Rect, Text as SvgText } from "react-native-svg";
import { format, parseISO } from "date-fns";
import { toast } from "sonner-native";

import type { Day, Level, Theme } from "@/lib/calendar-util";
import { getMonthLabels, groupByWeeks, levelColor } from "@/lib/calendar-util";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/components/theme-colors";

/** GitHub-style heatmap — RN port of the web activity-calendar. */
const BLOCK_SIZE = 12;
const BLOCK_MARGIN = 4;
const BLOCK_RADIUS = 2;
const FONT_SIZE = 12;
const DATE_FORMAT = "MMM do, yyyy";
const LEGEND_LEVELS: Level[] = [0, 1, 2, 3, 4];

const getTooltipMessage = (day: Day) => {
  const date = format(parseISO(day.date), DATE_FORMAT);
  if (!day.count) return `No posts on ${date}`;
  return `${day.count} post${day.count > 1 ? "s" : ""} on ${date}`;
};

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
    <View className="items-center gap-2">
      <Svg width={width} height={height}>
        <G>
          {monthLabels.map((label) => (
            <SvgText
              key={`${label.x}-${label.text}`}
              x={(BLOCK_SIZE + BLOCK_MARGIN) * label.x}
              y={FONT_SIZE}
              fontSize={FONT_SIZE}
              fill={colors.foreground}
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
                  strokeWidth={1}
                  stroke={theme.stroke}
                  onPress={() => toast(getTooltipMessage(day))}
                />
              ) : null,
            )}
          </G>
        ))}
      </Svg>
      <View className="w-full flex-row items-center justify-end gap-1">
        <Text className="text-muted-foreground text-xs">Less</Text>
        <Svg width={(BLOCK_SIZE + BLOCK_MARGIN) * 5 - BLOCK_MARGIN} height={BLOCK_SIZE}>
          {LEGEND_LEVELS.map((level) => (
            <Rect
              key={level}
              x={(BLOCK_SIZE + BLOCK_MARGIN) * level}
              width={BLOCK_SIZE}
              height={BLOCK_SIZE}
              rx={BLOCK_RADIUS}
              fill={levelColor(theme, level)}
              strokeWidth={1}
              stroke={theme.stroke}
            />
          ))}
        </Svg>
        <Text className="text-muted-foreground text-xs">More</Text>
      </View>
    </View>
  );
};
