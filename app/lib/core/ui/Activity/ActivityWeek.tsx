import { Theme } from "./calendarTypes";
import {
  getTheme,
  DEFAULT_WEEKDAY_LABELS,
  FULL_DAY_LABELS,
} from "./calendarUtil";

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
        {DEFAULT_WEEKDAY_LABELS.map((day, index) => (
          <ellipse
            className="block"
            key={day}
            cx={`${index * (100 / DEFAULT_WEEKDAY_LABELS.length)}%`}
            cy="50px"
            rx={data[day] ? `${data[day].level * 4}` : "0"}
            ry={data[day] ? `${data[day].level * 4}` : "0"}
            fill={theme[`level${data[day].level}` as keyof typeof theme]}
            strokeWidth={1}
            stroke={theme.stroke}
            data-tip={`${data[day].count} posts ${
              FULL_DAY_LABELS[day as keyof typeof FULL_DAY_LABELS]
            }s`}
          />
        ))}
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
