import type { Day as WeekDay } from "date-fns";
import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  formatISO,
  getDay,
  getMonth,
  nextDay,
  parseISO,
  subWeeks,
} from "date-fns";

export type CalendarLevel = 0 | 1 | 2 | 3 | 4;

export type CalendarDay = {
  date: string;
  count: number;
  level: CalendarLevel;
};

export type CalendarWeek = (CalendarDay | undefined)[];
export type CalendarWeeks = CalendarWeek[];

export type CalendarTheme = {
  readonly level4: string;
  readonly level3: string;
  readonly level2: string;
  readonly level1: string;
  readonly level0: string;
  readonly stroke: string;
};

export type CalendarPost = { createdAt: string };

export const DEFAULT_CALENDAR_THEME: CalendarTheme = {
  level4: "#4c1d95",
  level3: "#6d28d9",
  level2: "#8b5cf6",
  level1: "#c4b5fd",
  level0: "#ede9fe",
  stroke: "#ddd6fe",
};

export const DEFAULT_MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const DEFAULT_WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const FULL_DAY_LABELS: Record<string, string> = {
  Sun: "Sunday",
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
};

export const CALENDAR_LABELS = {
  Sun: "SU",
  Mon: "MO",
  Tue: "TU",
  Wed: "WE",
  Thu: "TH",
  Fri: "FR",
  Sat: "SA",
};

export const DEFAULT_CALENDAR_LABELS = {
  months: DEFAULT_MONTH_LABELS,
  weekdays: DEFAULT_WEEKDAY_LABELS,
  totalCount: "{{count}} posts in last 200 days",
  legend: { less: "Less", more: "More" },
};

export const MIN_DISTANCE_MONTH_LABELS = 2;
const HAS_EXPLICIT_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

const parseServerDate = (value: string): Date => {
  const iso = value.replace(" ", "T");
  if (!iso.includes("T") || HAS_EXPLICIT_ZONE.test(iso)) return new Date(iso);
  return new Date(`${iso}Z`);
};

export const calendarLevelColor = (theme: CalendarTheme, level: CalendarLevel): string => {
  switch (level) {
    case 0:
      return theme.level0;
    case 1:
      return theme.level1;
    case 2:
      return theme.level2;
    case 3:
      return theme.level3;
    case 4:
      return theme.level4;
  }
};

export const toCalendarLevel = (value: number): CalendarLevel => {
  if (value <= 0) return 0;
  if (value === 1) return 1;
  if (value === 2) return 2;
  if (value === 3) return 3;
  return 4;
};

export const getCalendarTheme = (theme?: CalendarTheme): CalendarTheme =>
  theme === undefined ? DEFAULT_CALENDAR_THEME : { ...DEFAULT_CALENDAR_THEME, ...theme };

export const groupCalendarDaysByWeeks = (
  days: CalendarDay[],
  weekStart: WeekDay = 0,
): CalendarWeeks => {
  if (days.length === 0) return [];

  const daysMap = new Map(days.map((day) => [day.date, day]));
  const firstInput = days[0];
  const lastInput = days[days.length - 1];
  if (firstInput === undefined || lastInput === undefined) return [];

  const normalizedDays = eachDayOfInterval({
    start: parseISO(firstInput.date),
    end: parseISO(lastInput.date),
  }).map((day): CalendarDay => {
    const date = formatISO(day, { representation: "date" });
    return daysMap.get(date) ?? { date, count: 0, level: 0 };
  });

  const firstDate = parseISO(normalizedDays[0]?.date ?? "");
  const firstCalendarDate =
    getDay(firstDate) === weekStart ? firstDate : subWeeks(nextDay(firstDate, weekStart), 1);
  const padding = Array.from(
    { length: differenceInCalendarDays(firstDate, firstCalendarDate) },
    (): undefined => undefined,
  );
  const paddedDays: (CalendarDay | undefined)[] = [...padding, ...normalizedDays];

  return Array.from({ length: Math.ceil(paddedDays.length / 7) }, (_, calendarWeek) =>
    paddedDays.slice(calendarWeek * 7, calendarWeek * 7 + 7),
  );
};

type CalendarLabel = { x: number; y: number; text: string };

export const getCalendarMonthLabels = (
  weeks: CalendarWeeks,
  monthNames: string[] = DEFAULT_MONTH_LABELS,
): CalendarLabel[] =>
  weeks
    .reduce<CalendarLabel[]>((labels, week, index) => {
      const firstDay = week.find((day) => day !== undefined);
      if (firstDay === undefined) return labels;
      const month = monthNames[getMonth(parseISO(firstDay.date))] ?? "";
      const previous = labels[labels.length - 1];
      return index === 0 || previous?.text !== month
        ? [...labels, { x: index, y: 0, text: month }]
        : labels;
    }, [])
    .filter((label, index, labels) => {
      if (index !== 0) return true;
      const second = labels[1];
      return second !== undefined && second.x - label.x > MIN_DISTANCE_MONTH_LABELS;
    });

const getPostLevel = (count: number, max: number): CalendarLevel => {
  if (count === 0) return 0;
  if (count < max * 0.3) return 1;
  if (count < max * 0.6) return 2;
  if (count < max * 0.9) return 3;
  return 4;
};

export const createPostsHeatmap = (posts: CalendarPost[], lastNDays: number) => {
  const days = eachDayOfInterval({ start: addDays(new Date(), -lastNDays), end: new Date() });
  const counts = new Map(days.map((day) => [format(day, "yyyy-MM-dd"), 0]));

  for (const post of posts) {
    const day = format(parseServerDate(post.createdAt), "yyyy-MM-dd");
    if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const max = Math.max(0, ...counts.values());
  const stats: CalendarDay[] = [...counts].map(([date, count]) => ({
    date,
    count,
    level: getPostLevel(count, max),
  }));
  return { stats, max };
};

export const createPostsDailyActivity = (posts: CalendarPost[]) => {
  const counts = new Map(DEFAULT_WEEKDAY_LABELS.map((day) => [day, 0]));
  for (const post of posts) {
    const day = format(parseServerDate(post.createdAt), "eee");
    if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const maximum = [...counts].reduce(
    (current, [day, count]) => (count > current.max ? { max: count, day } : current),
    { max: 0, day: "none" },
  );
  const stats = Object.fromEntries(
    [...counts].map(([day, count]) => [day, { count, level: getPostLevel(count, maximum.max) }]),
  );
  return { stats, max: maximum };
};

export const generateEmptyCalendarData = (year = new Date().getFullYear()): CalendarDay[] =>
  eachDayOfInterval({ start: new Date(year, 0, 1), end: new Date(year, 11, 31) }).map((date) => ({
    date: formatISO(date, { representation: "date" }),
    count: 0,
    level: 0,
  }));
