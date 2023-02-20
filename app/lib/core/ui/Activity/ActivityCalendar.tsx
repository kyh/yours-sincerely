import type { FunctionComponent, CSSProperties } from "react";
import type { Day as WeekDay } from "date-fns";
import { format, getDay, getYear, parseISO } from "date-fns";
import { Tooltip } from "~/lib/core/ui/Tooltip";

import type {
  Day,
  EventHandlerMap,
  Labels,
  ReactEvent,
  SVGRectEventHandler,
  Theme,
} from "./calendarTypes";
import {
  generateEmptyData,
  getMonthLabels,
  getTheme,
  groupByWeeks,
  MIN_DISTANCE_MONTH_LABELS,
  DEFAULT_WEEKDAY_LABELS,
  DEFAULT_LABELS,
} from "./calendarUtil";

type CalendarData = Array<Day>;

export interface Props {
  /**
   * List of calendar entries. Every `Day` object requires an ISO 8601 `date`
   * property in the format `yyyy-MM-dd`, a `count` property with the amount
   * of tracked data and finally a `level` property in the range `0 - 4` to
   * specify activity intensity.
   *
   * Example object:
   *
   * ```json
   * {
   *   date: "2021-02-20",
   *   count: 16,
   *   level: 3
   * }
   * ```
   */
  data: CalendarData;
  /**
   * Margin between blocks in pixels.
   */
  blockMargin?: number;
  /**
   * Border radius of blocks in pixels.
   */
  blockRadius?: number;
  /**
   * Block size in pixels.
   */
  blockSize?: number;
  /**
   * A date-fns/format compatible date string used in tooltips.
   */
  dateFormat?: string;
  /**
   * Event handlers to register for the SVG `<rect>` elements that are used to render the calendar days. Handler signature: `event => data => void`
   */
  eventHandlers?: EventHandlerMap;
  /**
   * Font size for text in pixels.
   */
  fontSize?: number;
  /**
   * Toggle to hide color legend below calendar.
   */
  hideColorLegend?: boolean;
  /**
   * Toggle to hide month labels above calendar.
   */
  hideMonthLabels?: boolean;
  /**
   * Toggle to hide total count below calendar.
   */
  hideTotalCount?: boolean;
  /**
   * Localization strings for all calendar labels. `totalCount` supports the placeholders `{{count}}` and `{{year}}`:
   */
  labels?: Labels;
  /**
   * Toggle for loading state. `data` property will be ignored if set.
   */
  loading?: boolean;
  /**
   * Toggle to show weekday labels left to the calendar.
   */
  showWeekdayLabels?: boolean;
  /**
   * Style object to pass to component container.
   */
  style?: CSSProperties;
  /**
   * An object specifying all theme colors explicitly`.
   */
  theme?: Theme;
  /**
   * Index of day to be used as start of week. 0 represents Sunday.
   */
  weekStart?: WeekDay;
}

export const ActivityCalendar: FunctionComponent<Props> = ({
  data,
  blockMargin = 4,
  blockRadius = 2,
  blockSize = 12,
  dateFormat = "MMM do, yyyy",
  eventHandlers = {},
  fontSize = 12,
  hideColorLegend = false,
  hideMonthLabels = false,
  hideTotalCount = false,
  labels: labelsProp,
  loading = false,
  showWeekdayLabels = false,
  style = {},
  theme: themeProp,
  weekStart = 0, // Sunday
}: Props) => {
  if (loading) data = generateEmptyData();
  if (data.length === 0) return null;

  const weeks = groupByWeeks(data, weekStart);
  const totalCount = data.reduce((sum, day) => sum + day.count, 0);
  const year = getYear(parseISO(data[0]?.date));

  const theme = getTheme(themeProp);
  const labels = Object.assign({}, DEFAULT_LABELS, labelsProp);
  const textHeight = hideMonthLabels ? 0 : fontSize + 2 * blockMargin;

  function getDimensions() {
    return {
      width: weeks.length * (blockSize + blockMargin) - blockMargin,
      height: textHeight + (blockSize + blockMargin) * 7 - blockMargin,
    };
  }

  function getTooltipMessage(contribution: Day) {
    const date = format(parseISO(contribution.date), dateFormat);
    if (!contribution.count) return `No posts on ${date}`;
    return `${contribution.count} post${
      contribution.count > 1 ? "s" : ""
    } on ${date}`;
  }

  function getEventHandlers(data: Day): SVGRectEventHandler {
    return (
      Object.keys(eventHandlers) as Array<keyof SVGRectEventHandler>
    ).reduce<SVGRectEventHandler>(
      (handlers, key) => ({
        ...handlers,
        [key]: (event: ReactEvent<SVGRectElement>) =>
          eventHandlers[key]?.(event)(data),
      }),
      {}
    );
  }

  function renderLabels() {
    const style = {
      fontSize,
    };

    if (!showWeekdayLabels && hideMonthLabels) {
      return null;
    }

    return (
      <>
        {showWeekdayLabels && (
          <g className="legend-weekday" style={style}>
            {weeks[1].map((day, y) => {
              if (!day || y % 2 === 0) {
                return null;
              }

              const dayIndex = getDay(parseISO(day.date));

              return (
                <text
                  x={-2 * blockMargin}
                  y={
                    textHeight +
                    (fontSize / 2 + blockMargin) +
                    (blockSize + blockMargin) * y
                  }
                  textAnchor="end"
                  key={day.date}
                >
                  {labels.weekdays
                    ? labels.weekdays[dayIndex]
                    : DEFAULT_WEEKDAY_LABELS[dayIndex]}
                </text>
              );
            })}
          </g>
        )}
        {!hideMonthLabels && (
          <g className="legend-month" style={style}>
            {getMonthLabels(weeks, labels.months).map(
              ({ text, x }, index, labels) => {
                // Skip the first month label if there's not enough space to the next one
                if (
                  index === 0 &&
                  labels[1] &&
                  labels[1].x - x <= MIN_DISTANCE_MONTH_LABELS
                ) {
                  return null;
                }

                return (
                  <text
                    x={(blockSize + blockMargin) * x}
                    alignmentBaseline="hanging"
                    key={x}
                  >
                    {text}
                  </text>
                );
              }
            )}
          </g>
        )}
      </>
    );
  }

  function renderBlocks() {
    return weeks
      .map((week, weekIndex) =>
        week.map((day, dayIndex) => {
          if (!day) {
            return null;
          }

          const style = loading
            ? {
                animation: `loadingAnimation 1.5s ease-in-out infinite`,
                animationDelay: `${weekIndex * 20 + dayIndex * 20}ms`,
              }
            : undefined;

          return (
            <Tooltip
              key={day.date}
              triggerProps={{
                ...getEventHandlers(day),
                as: "rect",
                x: 0,
                y: textHeight + (blockSize + blockMargin) * dayIndex,
                width: blockSize,
                height: blockSize,
                fill: theme[`level${day.level}` as keyof Theme],
                rx: blockRadius,
                ry: blockRadius,
                strokeWidth: 1,
                stroke: theme.stroke,
                key: day.date,
                style: style,
              }}
              tooltipContent={getTooltipMessage(day)}
            />
          );
        })
      )
      .map((week, x) => (
        <g key={x} transform={`translate(${(blockSize + blockMargin) * x}, 0)`}>
          {week}
        </g>
      ));
  }

  function renderFooter() {
    if (hideTotalCount && hideColorLegend) {
      return null;
    }

    return (
      <footer className="flex" style={{ marginTop: 2 * blockMargin, fontSize }}>
        {/* Placeholder */}
        {loading && <div>&nbsp;</div>}

        {!loading && !hideTotalCount && (
          <div className="count">
            {labels.totalCount
              ? labels.totalCount
                  .replace("{{count}}", String(totalCount))
                  .replace("{{year}}", String(year))
              : `${totalCount} posts in ${year}`}
          </div>
        )}

        {!loading && !hideColorLegend && (
          <div className="ml-auto flex items-center gap-1">
            <span style={{ marginRight: "0.4em" }}>
              {labels?.legend?.less ?? "Less"}
            </span>
            {Array(5)
              .fill(undefined)
              .map((_, index) => (
                <svg width={blockSize} height={blockSize} key={index}>
                  <rect
                    width={blockSize}
                    height={blockSize}
                    fill={theme[`level${index}` as keyof Theme]}
                    rx={blockRadius}
                    ry={blockRadius}
                  />
                </svg>
              ))}
            <span style={{ marginLeft: "0.4em" }}>
              {labels?.legend?.more ?? "More"}
            </span>
          </div>
        )}
      </footer>
    );
  }

  const { width, height } = getDimensions();
  const additionalStyles = {
    maxWidth: width,
    [`--activity-calendar-loading`]: theme.level0,
    [`--activity-calendar-loading-active`]: theme.level4,
  };

  return (
    <article style={{ ...style, ...additionalStyles }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="calendar"
      >
        {!loading && renderLabels()}
        {renderBlocks()}
      </svg>
      {renderFooter()}
    </article>
  );
};

export const Skeleton: FunctionComponent<Omit<Props, "data">> = (props) => (
  <ActivityCalendar data={[]} {...props} />
);
