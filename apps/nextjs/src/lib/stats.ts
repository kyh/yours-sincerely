import { addDays, differenceInDays, eachDayOfInterval, format } from "date-fns";

import type { RouterOutputs } from "@init/api";
import { DEFAULT_WEEKDAY_LABELS } from "@/app/(app)/profile/_components/calendar-util";

export const groupByDay = (
  posts: RouterOutputs["post"]["all"],
  lastNDays: number,
) => {
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
    {} as Record<string, RouterOutputs["post"]["all"]>,
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

export const maxPostsPerDay = (
  groupedByDay: Record<string, RouterOutputs["post"]["all"]>,
) => {
  const days = Object.keys(groupedByDay);

  const max = days.reduce((acc, day) => {
    const posts = groupedByDay[day];
    if (!posts?.length) return acc;
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

export const createPostsHeatmap = (
  posts: RouterOutputs["post"]["all"],
  lastNDays: number,
) => {
  const groupedByDay = groupByDay(posts, lastNDays);
  const max = maxPostsPerDay(groupedByDay);
  const days = Object.keys(groupedByDay);

  const stats = days.map((day) => {
    const posts = groupedByDay[day];
    if (!posts?.length) return { date: day, count: 0, level: 0 };
    return {
      date: day,
      count: posts.length,
      level: getPostLevel(posts.length, max),
    };
  });

  return { stats, max };
};

export const createPostsDailyActivity = (
  posts: RouterOutputs["post"]["all"],
) => {
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
      const count = daysMap[day].count ?? 0;
      daysMap[day] = {
        count: count + 1,
        level: 0,
      };
    }
  });

  const max = DEFAULT_WEEKDAY_LABELS.reduce(
    (acc, day) => {
      const count = daysMap[day]?.count ?? 0;
      if (acc.max < count) return { max: count, day };
      return acc;
    },
    { max: 0, day: "none" },
  );

  DEFAULT_WEEKDAY_LABELS.forEach((day) => {
    const d = daysMap[day];
    if (!d) return;
    d.level = getPostLevel(d.count, max.max);
  });

  return { stats: daysMap, max };
};

export const getTotalPosts = (posts: RouterOutputs["post"]["all"]) => {
  return posts.length;
};

export const getTotalLikes = (posts: RouterOutputs["post"]["all"]) => {
  return posts.reduce((acc, p) => acc + (p.likeCount ?? 0), 0);
};

const getStreaks = (posts: RouterOutputs["post"]["all"]) => {
  return posts.reduce(
    (res, currentPost, i) => {
      const previousPost = posts[i - 1];

      if (!previousPost) return res;

      const currentDate = currentPost.createdAt;
      const previousDate = previousPost.createdAt;

      if (!currentDate || !previousDate) return res;

      if (differenceInDays(previousDate, currentDate) < 1) {
        const lastDay = res[res.length - 1];
        if (lastDay) {
          res[res.length - 1] = lastDay + 1;
        }
      } else {
        res.push(1);
      }

      return res;
    },
    [1],
  );
};

export const getCurrentStreak = (posts: RouterOutputs["post"]["all"]) => {
  const streaks = getStreaks(posts);
  const latestPost = posts[0];

  if (!latestPost?.createdAt) return 0;

  if (differenceInDays(new Date(), latestPost.createdAt) < 1) {
    return streaks[0] ?? 0;
  }

  return 0;
};

export const getLongestStreak = (posts: RouterOutputs["post"]["all"]) => {
  const streaks = getStreaks(posts);

  return Math.max(...streaks);
};
