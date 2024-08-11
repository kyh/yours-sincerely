"use client";

import Link from "next/link";
import { useTheme } from "@init/ui/theme";

import {
  createPostsDailyActivity,
  createPostsHeatmap,
  getCurrentStreak,
  getLongestStreak,
  getTotalLikes,
  getTotalPosts,
} from "@/lib/stats";
import { api } from "@/trpc/react";
import { ActivityCalendar } from "./activity-calendar";
import { ActivityStats } from "./activity-stats";
import { ActivityWeek } from "./activity-week";
import { FULL_DAY_LABELS } from "./calendar-util";

const lightTheme = {
  level4: "#312e81",
  level3: "#4338ca",
  level2: "#6366f1",
  level1: "#a5b4fc",
  level0: "#e0e7ff",
  stroke: "#ddd6fe",
};

const darkTheme = {
  level4: "#6366f1",
  level3: "#4f46e5",
  level2: "#4338ca",
  level1: "#3730a3",
  level0: "#272567",
  stroke: "#312e81",
};

export const Profile = ({ id }: { id: string }) => {
  const [user] = api.account.byId.useSuspenseQuery({ id });
  const [currentUser] = api.account.me.useSuspenseQuery();
  const [posts] = api.post.all.useSuspenseQuery({ userId: id });

  const showEdit = currentUser ? currentUser.id === id : false;

  const lastNDays = 200;

  const stats = {
    heatmap: createPostsHeatmap(posts, lastNDays),
    daily: createPostsDailyActivity(posts),
    posts: getTotalPosts(posts),
    likes: getTotalLikes(posts),
    longestStreak: getLongestStreak(posts),
    currentStreak: getCurrentStreak(posts),
  };

  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <section className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {user.displayName ?? "Anonymous"}{" "}
        </h1>
        {showEdit && (
          <Link className="text-sm font-normal" href={`${user.id}/edit`}>
            Edit
          </Link>
        )}
      </div>
      <ActivityStats
        data={{
          posts: stats.posts,
          likes: stats.likes,
          currentStreak: stats.currentStreak,
          longestStreak: stats.longestStreak,
        }}
      />
      <ActivityCalendar
        data={stats.heatmap.stats}
        theme={isDarkMode ? darkTheme : lightTheme}
      />
      <div>
        <h2 className="text-sm font-bold">
          {stats.daily.max.day === "none" ? (
            <>No daily stats yet</>
          ) : (
            <>
              Favorite day to write is on{" "}
              <span className="text-primary">
                {
                  FULL_DAY_LABELS[
                    stats.daily.max.day as keyof typeof FULL_DAY_LABELS
                  ]
                }
                s
              </span>
            </>
          )}
        </h2>
        <ActivityWeek
          data={stats.daily.stats}
          theme={isDarkMode ? darkTheme : lightTheme}
        />
      </div>
    </section>
  );
};
