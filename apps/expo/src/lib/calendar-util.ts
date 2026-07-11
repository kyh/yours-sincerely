export {
  calendarLevelColor as levelColor,
  createPostsDailyActivity,
  createPostsHeatmap,
  DEFAULT_CALENDAR_THEME as DEFAULT_THEME,
  DEFAULT_MONTH_LABELS,
  DEFAULT_WEEKDAY_LABELS,
  FULL_DAY_LABELS,
  getCalendarMonthLabels as getMonthLabels,
  groupCalendarDaysByWeeks as groupByWeeks,
  toCalendarLevel as toLevel,
} from "@repo/contracts/calendar";

export type {
  CalendarDay as Day,
  CalendarLevel as Level,
  CalendarTheme as Theme,
  CalendarWeek as Week,
  CalendarWeeks as Weeks,
} from "@repo/contracts/calendar";
