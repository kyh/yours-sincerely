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
  type Day as WeekDay,
} from "date-fns";

import type { RouterOutputs } from "@repo/api";

import { parseServerDate } from "./dates";

/** Port of apps/web (app)/profile/_components/calendar-util.ts +
    calendar-types.ts (typed without non-null assertions). */

export type Level = 0 | 1 | 2 | 3 | 4;

export type Day = {
  date: string;
  count: number;
  level: Level;
};

export type Week = (Day | undefined)[];
export type Weeks = Week[];

export type Theme = {
  readonly level4: string;
  readonly level3: string;
  readonly level2: string;
  readonly level1: string;
  readonly level0: string;
  readonly stroke: string;
};

type Posts = RouterOutputs["post"]["getPostsByUser"]["posts"];

export const MIN_DISTANCE_MONTH_LABELS = 2;

export const DEFAULT_THEME: Theme = {
  level4: "#4c1d95",
  level3: "#6d28d9",
  level2: "#8b5cf6",
  level1: "#c4b5fd",
  level0: "#ede9fe",
  stroke: "#ddd6fe",
};

export const toLevel = (value: number): Level => {
  if (value <= 0) return 0;
  if (value === 1) return 1;
  if (value === 2) return 2;
  if (value === 3) return 3;
  return 4;
};

export const levelColor = (theme: Theme, level: Level): string => {
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

type Label = {
  x: number;
  y: number;
  text: string;
};

export const groupByWeeks = (days: Day[], weekStart: WeekDay = 0): Weeks => {
  if (days.length === 0) return [];

  const normalizedDays = normalizeCalendarDays(days);

  const firstDate = parseISO(normalizedDays[0]?.date ?? "");
  const firstCalendarDate =
    getDay(firstDate) === weekStart ? firstDate : subWeeks(nextDay(firstDate, weekStart), 1);

  const padding: (Day | undefined)[] = Array.from(
    { length: differenceInCalendarDays(firstDate, firstCalendarDate) },
    () => undefined,
  );
  const paddedDays = [...padding, ...normalizedDays];

  return Array.from({ length: Math.ceil(paddedDays.length / 7) }, (_, calendarWeek) =>
    paddedDays.slice(calendarWeek * 7, calendarWeek * 7 + 7),
  );
};

const normalizeCalendarDays = (days: Day[]): Day[] => {
  const daysMap = new Map<string, Day>();
  for (const day of days) daysMap.set(day.date, day);

  return eachDayOfInterval({
    start: parseISO(days[0]?.date ?? ""),
    end: parseISO(days[days.length - 1]?.date ?? ""),
  }).map((day) => {
    const date = formatISO(day, { representation: "date" });
    const existing = daysMap.get(date);
    if (existing !== undefined) return existing;
    return { date, count: 0, level: 0 };
  });
};

export const getMonthLabels = (
  weeks: Weeks,
  monthNames: string[] = DEFAULT_MONTH_LABELS,
): Label[] => {
  return weeks
    .reduce<Label[]>((labels, week, index) => {
      const firstWeekDay = week.find((day) => day !== undefined);
      if (firstWeekDay === undefined) return labels;

      const month = monthNames[getMonth(parseISO(firstWeekDay.date))] ?? "";
      const prev = labels[labels.length - 1];

      if (index === 0 || prev?.text !== month) {
        return [...labels, { x: index, y: 0, text: month }];
      }
      return labels;
    }, [])
    .filter((label, index, labels) => {
      if (index === 0) {
        const second = labels[1];
        return second !== undefined && second.x - label.x > MIN_DISTANCE_MONTH_LABELS;
      }
      return true;
    });
};

const groupByDay = (posts: Posts, lastNDays: number) => {
  const days = eachDayOfInterval({
    start: addDays(new Date(), -lastNDays),
    end: new Date(),
  });

  const daysMap: Record<string, Posts> = {};
  for (const day of days) daysMap[format(day, "yyyy-MM-dd")] = [];

  for (const post of posts) {
    const day = format(parseServerDate(post.createdAt), "yyyy-MM-dd");
    daysMap[day]?.push(post);
  }

  return daysMap;
};

const maxPostsPerDay = (groupedByDay: Record<string, Posts>) =>
  Object.values(groupedByDay).reduce((acc, posts) => Math.max(acc, posts.length), 0);

const getPostLevel = (count: number, max: number): Level => {
  if (count === 0) return 0;
  if (count < max * 0.3) return 1;
  if (count < max * 0.6) return 2;
  if (count < max * 0.9) return 3;
  return 4;
};

export const createPostsHeatmap = (posts: Posts, lastNDays: number) => {
  const groupedByDay = groupByDay(posts, lastNDays);
  const max = maxPostsPerDay(groupedByDay);

  const stats: Day[] = Object.entries(groupedByDay).map(([day, dayPosts]) => ({
    date: day,
    count: dayPosts.length,
    level: getPostLevel(dayPosts.length, max),
  }));

  return { stats, max };
};

export const createPostsDailyActivity = (posts: Posts) => {
  const daysMap: Record<string, { count: number; level: Level }> = {};
  for (const day of DEFAULT_WEEKDAY_LABELS) daysMap[day] = { count: 0, level: 0 };

  for (const post of posts) {
    const day = format(parseServerDate(post.createdAt), "eee");
    const entry = daysMap[day];
    if (entry !== undefined) entry.count += 1;
  }

  const max = DEFAULT_WEEKDAY_LABELS.reduce<{ max: number; day: string }>(
    (acc, day) => {
      const entry = daysMap[day];
      if (entry !== undefined && acc.max < entry.count) return { max: entry.count, day };
      return acc;
    },
    { max: 0, day: "none" },
  );

  for (const day of DEFAULT_WEEKDAY_LABELS) {
    const entry = daysMap[day];
    if (entry !== undefined) entry.level = getPostLevel(entry.count, max.max);
  }

  return { stats: daysMap, max };
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
