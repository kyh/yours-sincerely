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

import { parseServerDate } from "./content";

export type CalendarLevel = 0 | 1 | 2 | 3 | 4;

export interface CalendarDay {
  date: string;
  count: number;
  level: CalendarLevel;
}

export type CalendarWeek = (CalendarDay | undefined)[];
export type CalendarWeeks = CalendarWeek[];

export interface CalendarTheme {
  readonly level4: string;
  readonly level3: string;
  readonly level2: string;
  readonly level1: string;
  readonly level0: string;
  readonly stroke: string;
}

export interface CalendarPost {
  createdAt: string;
}

export const DEFAULT_CALENDAR_THEME: CalendarTheme = {
  level0: "#ede9fe",
  level1: "#c4b5fd",
  level2: "#8b5cf6",
  level3: "#6d28d9",
  level4: "#4c1d95",
  stroke: "#ddd6fe",
};

/** Indigo ramps for the profile heatmap, keyed by resolved appearance —
    the one place both platforms read them from. */
export const PROFILE_CALENDAR_THEMES = {
  dark: {
    level0: "#272567",
    level1: "#3730a3",
    level2: "#4338ca",
    level3: "#4f46e5",
    level4: "#6366f1",
    stroke: "#312e81",
  },
  light: {
    level0: "#e0e7ff",
    level1: "#a5b4fc",
    level2: "#6366f1",
    level3: "#4338ca",
    level4: "#312e81",
    stroke: "#ddd6fe",
  },
} satisfies Record<"light" | "dark", CalendarTheme>;

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

export const DEFAULT_WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type WeekdayLabel = (typeof DEFAULT_WEEKDAY_LABELS)[number];

export const FULL_DAY_LABELS = {
  Fri: "Friday",
  Mon: "Monday",
  Sat: "Saturday",
  Sun: "Sunday",
  Thu: "Thursday",
  Tue: "Tuesday",
  Wed: "Wednesday",
} satisfies Record<WeekdayLabel, string>;

export const DEFAULT_CALENDAR_LABELS = {
  legend: { less: "Less", more: "More" },
  months: DEFAULT_MONTH_LABELS,
  totalCount: "{{count}} posts in last 200 days",
  weekdays: DEFAULT_WEEKDAY_LABELS,
};

export const MIN_DISTANCE_MONTH_LABELS = 2;

export const calendarLevelColor = (theme: CalendarTheme, level: CalendarLevel): string => {
  switch (level) {
    case 0: {
      return theme.level0;
    }
    case 1: {
      return theme.level1;
    }
    case 2: {
      return theme.level2;
    }
    case 3: {
      return theme.level3;
    }
    case 4: {
      return theme.level4;
    }
    default: {
      const exhaustive: never = level;
      throw new Error(`Unknown calendar level ${String(exhaustive)}`);
    }
  }
};

export const getCalendarTheme = (theme?: CalendarTheme): CalendarTheme =>
  theme ?? DEFAULT_CALENDAR_THEME;

export const groupCalendarDaysByWeeks = (
  days: CalendarDay[],
  weekStart: WeekDay = 0,
): CalendarWeeks => {
  if (days.length === 0) {
    return [];
  }

  const daysMap = new Map(days.map((day) => [day.date, day]));
  const [firstInput] = days;
  const lastInput = days.at(-1);
  if (firstInput === undefined || lastInput === undefined) {
    return [];
  }

  const normalizedDays = eachDayOfInterval({
    end: parseISO(lastInput.date),
    start: parseISO(firstInput.date),
  }).map((day): CalendarDay => {
    const date = formatISO(day, { representation: "date" });
    return daysMap.get(date) ?? { count: 0, date, level: 0 };
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

interface CalendarLabel {
  x: number;
  y: number;
  text: string;
}

export const getCalendarMonthLabels = (
  weeks: CalendarWeeks,
  monthNames: string[] = DEFAULT_MONTH_LABELS,
): CalendarLabel[] => {
  const labels: CalendarLabel[] = [];
  for (const [index, week] of weeks.entries()) {
    const firstDay = week.find((day) => day !== undefined);
    if (firstDay === undefined) {
      continue;
    }
    const month = monthNames[getMonth(parseISO(firstDay.date))] ?? "";
    const previous = labels.at(-1);
    if (index === 0 || previous?.text !== month) {
      labels.push({ text: month, x: index, y: 0 });
    }
  }
  return labels.filter((label, index, all) => {
    if (index !== 0) {
      return true;
    }
    const [, second] = all;
    return second !== undefined && second.x - label.x > MIN_DISTANCE_MONTH_LABELS;
  });
};

const getPostLevel = (count: number, max: number): CalendarLevel => {
  if (count === 0) {
    return 0;
  }
  if (count < max * 0.3) {
    return 1;
  }
  if (count < max * 0.6) {
    return 2;
  }
  if (count < max * 0.9) {
    return 3;
  }
  return 4;
};

export const createPostsHeatmap = (posts: CalendarPost[], lastNDays: number) => {
  const days = eachDayOfInterval({ end: new Date(), start: addDays(new Date(), -lastNDays) });
  const counts = new Map(days.map((day) => [format(day, "yyyy-MM-dd"), 0]));

  for (const post of posts) {
    const day = format(parseServerDate(post.createdAt), "yyyy-MM-dd");
    if (counts.has(day)) {
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
  }

  const max = Math.max(0, ...counts.values());
  const stats: CalendarDay[] = [...counts].map(([date, count]) => ({
    count,
    date,
    level: getPostLevel(count, max),
  }));
  return { max, stats };
};

export const createPostsDailyActivity = (posts: CalendarPost[]) => {
  const counts = new Map<WeekdayLabel, number>(DEFAULT_WEEKDAY_LABELS.map((day) => [day, 0]));
  for (const post of posts) {
    const formatted = format(parseServerDate(post.createdAt), "eee");
    const day = DEFAULT_WEEKDAY_LABELS.find((label) => label === formatted);
    if (day !== undefined) {
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
  }

  let maxDay: WeekdayLabel | "none" = "none";
  let maxCount = 0;
  for (const [day, count] of counts) {
    if (count > maxCount) {
      maxDay = day;
      maxCount = count;
    }
  }
  const stats = Object.fromEntries(
    [...counts].map(([day, count]): [WeekdayLabel, { count: number; level: CalendarLevel }] => [
      day,
      { count, level: getPostLevel(count, maxCount) },
    ]),
  );
  return { max: { day: maxDay, max: maxCount }, stats };
};

export const generateEmptyCalendarData = (year = new Date().getFullYear()): CalendarDay[] =>
  eachDayOfInterval({ end: new Date(year, 11, 31), start: new Date(year, 0, 1) }).map((date) => ({
    count: 0,
    date: formatISO(date, { representation: "date" }),
    level: 0,
  }));
