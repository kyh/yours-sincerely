"use client";

import { Card } from "@init/ui/card";
import { useTheme } from "@init/ui/theme";
import { useMediaQuery } from "@init/ui/utils";

import { api } from "@/trpc/react";
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
  const { resolvedTheme } = useTheme();
  const [{ user: currentUser }] = api.auth.workspace.useSuspenseQuery();
  const [{ user }] = api.user.getUser.useSuspenseQuery({ userId });
  const [{ userStats }] = api.user.getUserStats.useSuspenseQuery({
    userId,
  });
  const [{ posts }] = api.post.getPostsByUser.useSuspenseQuery({ userId });
  const isDesktop = useMediaQuery();

  if (!user) {
    return <ProfileNotFound />;
  }

  const allowEdit = currentUser ? currentUser.id === user.id : false;
  const dailyData = createPostsDailyActivity(posts);
  const heatmapData = createPostsHeatmap(posts, isDesktop ? 200 : 120);
  const isDarkMode = resolvedTheme === "dark";

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
