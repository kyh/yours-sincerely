"use client";

import { Card } from "@repo/ui/card";
import { isDarkTheme, useTheme } from "@repo/ui/theme";
import { useMediaQuery } from "@repo/ui/utils";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/react";
import { ActivityCalendar } from "./activity-calendar";
import { ActivityStats } from "./activity-stats";
import { ActivityWeek } from "./activity-week";
import {
  createPostsDailyActivity,
  createPostsHeatmap,
  FULL_DAY_LABELS,
} from "./calendar-util";
import { ProfileForm } from "./profile-form";

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

type ProfileProps = {
  userId: string;
};

export const Profile = ({ userId }: ProfileProps) => {
  const trpc = useTRPC();
  const { resolvedTheme } = useTheme();
  const {
    data: { user: currentUser },
  } = useSuspenseQuery(trpc.auth.workspace.queryOptions());
  const {
    data: { user },
  } = useSuspenseQuery(trpc.user.getUser.queryOptions({ userId }));
  const {
    data: { userStats },
  } = useSuspenseQuery(
    trpc.user.getUserStats.queryOptions({
      userId,
    }),
  );
  const {
    data: { posts },
  } = useSuspenseQuery(trpc.post.getPostsByUser.queryOptions({ userId }));
  const isDesktop = useMediaQuery();

  if (!user) {
    return <ProfileNotFound />;
  }

  const allowEdit = currentUser ? currentUser.id === user.id : false;
  const dailyData = createPostsDailyActivity(posts);
  const heatmapData = createPostsHeatmap(posts, isDesktop ? 200 : 120);
  const isDarkMode = isDarkTheme(resolvedTheme);

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-6 lg:grid-rows-2">
      <div className="lg:col-span-6">
        <Card className="lg:rounded-t-[calc(2rem+1px)]">
          <ProfileForm userId={userId} readonly={!allowEdit} />
          <div className="mx-auto">
            <ActivityCalendar
              data={heatmapData.stats}
              theme={isDarkMode ? darkTheme : lightTheme}
            />
          </div>
        </Card>
      </div>
      <div className="lg:col-span-3">
        <Card className="h-60 items-center justify-center lg:rounded-bl-[calc(2rem+1px)]">
          <h2 className="text-sm font-bold">
            {dailyData.max.day === "none" ? (
              <>No daily stats yet</>
            ) : (
              <>
                Favorite day to write is on{" "}
                <span className="text-primary">
                  {
                    FULL_DAY_LABELS[
                      dailyData.max.day as keyof typeof FULL_DAY_LABELS
                    ]
                  }
                  s
                </span>
              </>
            )}
          </h2>
          <ActivityWeek
            data={dailyData.stats}
            theme={isDarkMode ? darkTheme : lightTheme}
          />
        </Card>
      </div>
      <div className="lg:col-span-3">
        <Card className="h-60 items-center justify-center lg:rounded-br-[calc(2rem+1px)]">
          <ActivityStats
            posts={userStats?.totalPostCount ?? 0}
            likes={userStats?.totalLikeCount ?? 0}
            currentStreak={userStats?.currentPostStreak ?? 0}
            longestStreak={userStats?.longestPostStreak ?? 0}
          />
        </Card>
      </div>
    </section>
  );
};

const ProfileNotFound = () => {
  return <h1>Hmm, can't seem to find the person you're looking for</h1>;
};
