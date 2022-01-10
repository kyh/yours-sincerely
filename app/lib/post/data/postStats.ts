import { format, addDays, eachDayOfInterval } from "date-fns";
import { DEFAULT_WEEKDAY_LABELS } from "~/lib/core/ui/Activity/calendarUtil";
import { Post } from "./postSchema";

export const groupByDay = (posts: Post[], lastNDays: number) => {
  const days = eachDayOfInterval({
    start: addDays(new Date(), -lastNDays),
    end: new Date(),
  });

  const daysMap = days.reduce((acc, day) => {
    const date = format(day, "yyyy-MM-dd");
    acc[date] = [];
    return acc;
  }, {} as Record<string, Post[]>);

  posts.forEach((post) => {
    const date = new Date(post.createdAt!);
    const day = format(date, "yyyy-MM-dd");
    if (daysMap[day]) {
      daysMap[day].push(post);
    }
  });

  return daysMap;
};

export const maxPostsPerDay = (groupedByDay: { [key: string]: Post[] }) => {
  const days = Object.keys(groupedByDay);

  const max = days.reduce((acc, day) => {
    const posts = groupedByDay[day];
    if (acc < posts.length) return posts.length;
    return acc;
  }, 0);

  return max;
};

export const getPostLevel = (count: number, max: number): 0 | 1 | 2 | 3 | 4 => {
  if (!count) return 0;
  if (count < max * 0.3) return 1;
  if (count < max * 0.6) return 2;
  if (count < max * 0.9) return 3;
  return 4;
};

export const createPostsHeatmap = (posts: Post[], lastNDays: number) => {
  const groupedByDay = groupByDay(posts, lastNDays);
  const max = maxPostsPerDay(groupedByDay);
  const days = Object.keys(groupedByDay);

  const stats = days.map((day) => {
    const posts = groupedByDay[day];
    return {
      date: day,
      count: posts.length,
      level: getPostLevel(posts.length, max),
    };
  });

  return { stats, max };
};

export const createPostsDailyActivity = (posts: Post[]) => {
  const daysMap = DEFAULT_WEEKDAY_LABELS.reduce((acc, day) => {
    acc[day] = {
      count: 0,
      level: 0,
    };
    return acc;
  }, {} as Record<string, { count: number; level: number }>);

  posts.forEach((post) => {
    const date = new Date(post.createdAt!);
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
      if (acc.max < daysMap[day].count) return { max: daysMap[day].count, day };
      return acc;
    },
    { max: 0, day: "Sun" }
  );

  DEFAULT_WEEKDAY_LABELS.forEach((day) => {
    daysMap[day].level = getPostLevel(daysMap[day].count, max.max);
  });

  return { stats: daysMap, max };
};
