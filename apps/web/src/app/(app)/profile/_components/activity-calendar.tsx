import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip";
import type {
  CalendarDay as Day,
  CalendarLevel as Level,
  CalendarTheme as Theme,
} from "@repo/contracts/calendar";
import {
  calendarLevelColor,
  getCalendarMonthLabels as getMonthLabels,
  groupCalendarDaysByWeeks as groupByWeeks,
} from "@repo/contracts/calendar";
import { format, parseISO } from "date-fns";

const BLOCK_SIZE = 12;
const BLOCK_MARGIN = 4;
const BLOCK_RADIUS = 2;
const FONT_SIZE = 12;
const DATE_FORMAT = "MMM do, yyyy";
const LEGEND_LEVELS: Level[] = [0, 1, 2, 3, 4];

const getTooltipMessage = (contribution: Day) => {
  const date = format(parseISO(contribution.date), DATE_FORMAT);
  if (!contribution.count) {
    return `No posts on ${date}`;
  }
  return `${contribution.count} post${contribution.count > 1 ? "s" : ""} on ${date}`;
};

interface Props {
  data: Day[];
  theme: Theme;
}

export const ActivityCalendar = ({ data, theme }: Props) => {
  if (data.length === 0) {
    return null;
  }

  const weeks = groupByWeeks(data);
  const textHeight = FONT_SIZE + 2 * BLOCK_MARGIN;
  const height = textHeight + (BLOCK_SIZE + BLOCK_MARGIN) * 7 - BLOCK_MARGIN;
  const width = weeks.length * (BLOCK_SIZE + BLOCK_MARGIN) - BLOCK_MARGIN;

  const renderLabels = () => (
    <g className="legend-month fill-foreground" style={{ fontSize: FONT_SIZE }}>
      {getMonthLabels(weeks).map(({ text, x }) => (
        <text x={(BLOCK_SIZE + BLOCK_MARGIN) * x} alignmentBaseline="hanging" key={x}>
          {text}
        </text>
      ))}
    </g>
  );

  const renderBlocks = () =>
    weeks
      .map((week) =>
        week.map((day, dayIndex) => {
          if (!day) {
            return null;
          }

          const rectProps = {
            fill: calendarLevelColor(theme, day.level),
            height: BLOCK_SIZE,
            rx: BLOCK_RADIUS,
            ry: BLOCK_RADIUS,
            stroke: theme.stroke,
            strokeWidth: 1,
            width: BLOCK_SIZE,
            x: 0,
            y: textHeight + (BLOCK_SIZE + BLOCK_MARGIN) * dayIndex,
          };

          return (
            <Tooltip key={day.date}>
              <TooltipTrigger render={<rect {...rectProps} />} />
              <TooltipContent>{getTooltipMessage(day)}</TooltipContent>
            </Tooltip>
          );
        }),
      )
      .map((week, x) => (
        <g
          key={weeks[x]?.map((day) => day?.date ?? "empty").join("|")}
          transform={`translate(${(BLOCK_SIZE + BLOCK_MARGIN) * x}, 0)`}
        >
          {week}
        </g>
      ));

  const renderFooter = () => (
    <footer className="flex" style={{ fontSize: FONT_SIZE, marginTop: 2 * BLOCK_MARGIN }}>
      <div className="ml-auto flex items-center gap-1">
        <span style={{ marginRight: "0.4em" }}>Less</span>
        {LEGEND_LEVELS.map((level) => (
          <svg width={BLOCK_SIZE} height={BLOCK_SIZE} key={level}>
            <rect
              width={BLOCK_SIZE}
              height={BLOCK_SIZE}
              fill={calendarLevelColor(theme, level)}
              rx={BLOCK_RADIUS}
              ry={BLOCK_RADIUS}
            />
          </svg>
        ))}
        <span style={{ marginLeft: "0.4em" }}>More</span>
      </div>
    </footer>
  );

  return (
    <article style={{ maxWidth: width }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="calendar">
        {renderLabels()}
        {renderBlocks()}
      </svg>
      {renderFooter()}
    </article>
  );
};
