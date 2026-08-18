import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip";

import type { CalendarLevel } from "@repo/contracts/calendar";
import type { Theme } from "./calendar-types";
import {
  calendarLevelColor,
  DEFAULT_WEEKDAY_LABELS,
  FULL_DAY_LABELS,
  getCalendarTheme as getTheme,
} from "@repo/contracts/calendar";

type Props = {
  data: Record<string, { count: number; level: CalendarLevel }>;
  theme?: Theme;
};

export const ActivityWeek = ({ data, theme: themeProp }: Props) => {
  const theme = getTheme(themeProp);

  return (
    <svg width="100%" height="100px">
      <rect
        className="block"
        fill={theme.level0}
        width="100%"
        height="16px"
        rx="8px"
        ry="8px"
        y="84px"
      />
      <g style={{ transform: "translateX(5.5%)" }}>
        {DEFAULT_WEEKDAY_LABELS.map((day, index) => {
          const dayStats = data[day];
          const ellipseProps = {
            className: "block",
            cx: `${index * (100 / DEFAULT_WEEKDAY_LABELS.length)}%`,
            cy: "50px",
            rx: dayStats ? `${dayStats.level * 4}` : "0",
            ry: dayStats ? `${dayStats.level * 4}` : "0",
            fill: dayStats ? calendarLevelColor(theme, dayStats.level) : undefined,
            strokeWidth: 1,
            stroke: theme.stroke,
          };

          return (
            <Tooltip key={day}>
              <TooltipTrigger render={<ellipse {...ellipseProps} />} />
              <TooltipContent>
                {`${dayStats?.count} posts written on ${FULL_DAY_LABELS[day]}s`}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </g>
      <g style={{ fontSize: 12, transform: "translateX(5%)" }}>
        {DEFAULT_WEEKDAY_LABELS.map((day, index) => (
          <text
            key={day}
            x={`${index * (100 / DEFAULT_WEEKDAY_LABELS.length)}%`}
            y="96px"
            fill="currentColor"
          >
            {day.charAt(0)}
          </text>
        ))}
      </g>
    </svg>
  );
};
