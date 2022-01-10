import { Theme } from "./calendarTypes";
import {
  DEFAULT_THEME,
  DEFAULT_WEEKDAY_LABELS,
  fullDayLabel,
} from "./calendarUtil";

type Props = {
  data: Record<string, { count: number; level: number }>;
};

export const ActivityWeek = ({ data }: Props) => {
  return (
    <svg width="100%" height="100px">
      <rect
        className="block"
        fill="#ede9fe"
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
            fill={DEFAULT_THEME[`level${data[day].level}` as keyof Theme]}
            data-tip={`${data[day].count} posts ${
              fullDayLabel[day as keyof typeof fullDayLabel]
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
          >
            {day.charAt(0)}
          </text>
        ))}
      </g>
    </svg>
  );
};

export default ActivityWeek;
