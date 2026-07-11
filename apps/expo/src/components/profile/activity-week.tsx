import { useState } from "react";
import { View } from "react-native";
import Svg, { Ellipse, G, Rect, Text as SvgText } from "react-native-svg";
import { toast } from "sonner-native";

import type { CalendarLevel, CalendarTheme as Theme } from "@repo/contracts/calendar";
import {
  calendarLevelColor as levelColor,
  DEFAULT_WEEKDAY_LABELS,
  FULL_DAY_LABELS,
} from "@repo/contracts/calendar";
import { useThemeColors } from "@/components/theme-colors";

/** Weekly activity bubbles — RN port of the web activity-week chart. */
type Props = {
  data: Record<string, { count: number; level: CalendarLevel }>;
  theme: Theme;
};

export const ActivityWeek = ({ data, theme }: Props) => {
  const colors = useThemeColors();
  const [width, setWidth] = useState(0);

  const step = width / DEFAULT_WEEKDAY_LABELS.length;

  return (
    <View className="w-full" onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={100}>
          <Rect fill={theme.level0} width={width} height={16} rx={8} ry={8} y={84} />
          <G x={width * 0.055}>
            {DEFAULT_WEEKDAY_LABELS.map((day, index) => {
              const entry = data[day];
              const level = entry?.level ?? 0;
              const radius = entry !== undefined ? entry.level * 4 : 0;
              const count = entry?.count ?? 0;
              return (
                <Ellipse
                  key={day}
                  cx={index * step}
                  cy={50}
                  rx={radius}
                  ry={radius}
                  fill={levelColor(theme, level)}
                  strokeWidth={1}
                  stroke={theme.stroke}
                  onPress={() => toast(`${count} posts written on ${FULL_DAY_LABELS[day] ?? day}s`)}
                />
              );
            })}
          </G>
          <G x={width * 0.05}>
            {DEFAULT_WEEKDAY_LABELS.map((day, index) => (
              <SvgText
                key={day}
                x={index * step}
                y={96}
                fontSize={12}
                fill={colors.mutedForeground}
              >
                {day.charAt(0)}
              </SvgText>
            ))}
          </G>
        </Svg>
      )}
    </View>
  );
};
