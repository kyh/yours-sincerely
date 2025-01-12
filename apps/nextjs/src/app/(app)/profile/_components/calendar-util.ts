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

import type { Day, Theme, Weeks } from "./calendar-types";
import type { RouterOutputs } from "@init/api";

type Posts = RouterOutputs["post"]["getPostsByUser"]["posts"];

export const MIN_DISTANCE_MONTH_LABELS = 2;

export const DEFAULT_THEME = {
  level4: "#4c1d95",
  level3: "#6d28d9",
  level2: "#8b5cf6",
  level1: "#c4b5fd",
  level0: "#ede9fe",
  stroke: "#ddd6fe",
};

type Label = {
  x: number;
  y: number;
  text: string;
};

export const groupByWeeks = (
  days: Day[],
  weekStart: WeekDay = 0, // 0 = Sunday
): Weeks => {
  if (days.length === 0) {
    return [];
  }

  // The calendar expects a continuous sequence of days, so fill gaps with empty activity.
  const normalizedDays = normalizeCalendarDays(days);

  // Determine the first date of the calendar. If the first contribution date is not
  // specified week day the desired day one week earlier will be selected.
  const firstDate = parseISO(normalizedDays[0]?.date ?? "");
  const firstCalendarDate =
    getDay(firstDate) === weekStart
      ? firstDate
      : subWeeks(nextDay(firstDate, weekStart), 1);

  // In order to correctly group contributions by week it is necessary to
  // left pad the list because the first date might not be desired week day.
  const paddedDays = [
    ...Array(differenceInCalendarDays(firstDate, firstCalendarDate)).fill(
      undefined,
    ),
    ...normalizedDays,
  ];

  return Array(Math.ceil(paddedDays.length / 7))
    .fill(undefined)
    .map((_, calendarWeek) =>
      paddedDays.slice(calendarWeek * 7, calendarWeek * 7 + 7),
    );
};

const normalizeCalendarDays = (days: Day[]): Day[] => {
  const daysMap = days.reduce((map, day) => {
    map.set(day.date, day);
    return map;
  }, new Map<string, Day>());

  return eachDayOfInterval({
    start: parseISO(days[0]?.date ?? ""),
    end: parseISO(days[days.length - 1]?.date ?? ""),
  }).map((day) => {
    const date = formatISO(day, { representation: "date" });

    if (daysMap.has(date)) {
      return daysMap.get(date)!;
    }

    return {
      date,
      count: 0,
      level: 0,
    };
  });
};

export const getMonthLabels = (
  weeks: Weeks,
  monthNames: string[] = DEFAULT_MONTH_LABELS,
) => {
  return weeks
    .reduce<Label[]>((labels, week, index) => {
      const firstWeekDay = week.find((day) => day !== undefined);

      if (!firstWeekDay) {
        throw new Error(`Unexpected error: Week is empty: [${week}]`);
      }

      const month = monthNames[getMonth(parseISO(firstWeekDay.date))]!;
      const prev = labels[labels.length - 1];

      if (index === 0 || prev?.text !== month) {
        return [
          ...labels,
          {
            x: index,
            y: 0,
            text: month,
          },
        ];
      }

      return labels;
    }, [])
    .filter((label, index, labels) => {
      if (index === 0) {
        return labels[1] && labels[1].x - label.x > MIN_DISTANCE_MONTH_LABELS;
      }

      return true;
    });
};

export const getTheme = (theme?: Theme): Theme => {
  if (theme) {
    return Object.assign({}, DEFAULT_THEME, theme);
  }

  return DEFAULT_THEME;
};

export const generateEmptyData = (): Day[] => {
  const year = new Date().getFullYear();
  const days = eachDayOfInterval({
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31),
  });

  return days.map((date) => ({
    date: formatISO(date, { representation: "date" }),
    count: 0,
    level: 0,
  }));
};

const groupByDay = (posts: Posts, lastNDays: number) => {
  const days = eachDayOfInterval({
    start: addDays(new Date(), -lastNDays),
    end: new Date(),
  });

  const daysMap = days.reduce(
    (acc, day) => {
      const date = format(day, "yyyy-MM-dd");
      acc[date] = [];
      return acc;
    },
    {} as Record<string, Posts>,
  );

  posts.forEach((post) => {
    const date = new Date(post.createdAt);
    const day = format(date, "yyyy-MM-dd");
    if (daysMap[day]) {
      daysMap[day].push(post);
    }
  });

  return daysMap;
};

const maxPostsPerDay = (groupedByDay: Record<string, Posts>) => {
  const days = Object.keys(groupedByDay);

  const max = days.reduce((acc, day) => {
    const posts = groupedByDay[day];
    if (!posts) return acc;
    if (acc < posts.length) return posts.length;
    return acc;
  }, 0);

  return max;
};

const getPostLevel = (count: number, max: number): 0 | 1 | 2 | 3 | 4 => {
  if (!count) return 0;
  if (count < max * 0.3) return 1;
  if (count < max * 0.6) return 2;
  if (count < max * 0.9) return 3;
  return 4;
};

export const createPostsHeatmap = (posts: Posts, lastNDays: number) => {
  const groupedByDay = groupByDay(posts, lastNDays);
  const max = maxPostsPerDay(groupedByDay);
  const days = Object.keys(groupedByDay);

  const stats = days.map((day) => {
    const posts = groupedByDay[day];
    return {
      date: day,
      count: posts?.length ?? 0,
      level: posts ? getPostLevel(posts.length, max) : 0,
    };
  });

  return { stats, max };
};

export const createPostsDailyActivity = (posts: Posts) => {
  const daysMap = DEFAULT_WEEKDAY_LABELS.reduce(
    (acc, day) => {
      acc[day] = {
        count: 0,
        level: 0,
      };
      return acc;
    },
    {} as Record<string, { count: number; level: number }>,
  );

  posts.forEach((post) => {
    const date = new Date(post.createdAt);
    const day = format(date, "eee");
    if (daysMap[day]) {
      daysMap[day] = {
        count: daysMap[day].count + 1,
        level: 0,
      };
    }
  });

  const max = DEFAULT_WEEKDAY_LABELS.reduce(
    (acc, day) => {
      if (!daysMap[day]) return acc;
      if (acc.max < daysMap[day].count) return { max: daysMap[day].count, day };
      return acc;
    },
    { max: 0, day: "none" },
  );

  DEFAULT_WEEKDAY_LABELS.forEach((day) => {
    if (!daysMap[day]) return;
    daysMap[day].level = getPostLevel(daysMap[day].count, max.max);
  });

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

export const DEFAULT_WEEKDAY_LABELS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

export const FULL_DAY_LABELS = {
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

export const DEFAULT_LABELS = {
  months: DEFAULT_MONTH_LABELS,
  weekdays: DEFAULT_WEEKDAY_LABELS,
  totalCount: "{{count}} posts in last 200 days",
  legend: {
    less: "Less",
    more: "More",
  },
};
