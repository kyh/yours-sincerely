import { Tooltip, TooltipContent, TooltipTrigger } from "@init/ui/tooltip";

import type { Theme } from "./calendar-types";
import {
  DEFAULT_WEEKDAY_LABELS,
  FULL_DAY_LABELS,
  getTheme,
} from "./calendar-util";

type Props = {
  data: Record<string, { count: number; level: number }>;
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
          const ellipseProps = {
            className: "block",
            key: day,
            cx: `${index * (100 / DEFAULT_WEEKDAY_LABELS.length)}%`,
            cy: "50px",
            rx: data[day] ? `${(data[day]?.level ?? 0) * 4}` : "0",
            ry: data[day] ? `${(data[day]?.level ?? 0) * 4}` : "0",
            fill: theme[`level${data[day]?.level}` as keyof typeof theme],
            strokeWidth: 1,
            stroke: theme.stroke,
          };

          return (
            <Tooltip key={day}>
              <TooltipTrigger asChild>
                <ellipse {...ellipseProps} />
              </TooltipTrigger>
              <TooltipContent>
                {`${data[day]?.count} posts written on ${
                  FULL_DAY_LABELS[day as keyof typeof FULL_DAY_LABELS]
                }s`}
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

export default ActivityWeek;
