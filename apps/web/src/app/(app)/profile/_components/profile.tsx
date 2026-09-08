"use client";

import { Card } from "@repo/ui/components/card";
import { isDarkTheme, useTheme } from "@/components/theme";
import { useMediaQuery } from "@repo/ui/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useWorkspaceUser } from "@/lib/use-workspace-user";
import { orpc } from "@/orpc/react";
import { ActivityCalendar } from "./activity-calendar";
import { ActivityStats } from "./activity-stats";
import { ActivityWeek } from "./activity-week";
import {
  createPostsDailyActivity,
  createPostsHeatmap,
  FULL_DAY_LABELS,
  PROFILE_CALENDAR_THEMES,
} from "@repo/contracts/calendar";
import { ProfileForm } from "./profile-form";

interface ProfileProps {
  userId: string;
}

const ProfileNotFound = () => (
  <h1>Hmm, can&apos;t seem to find the person you&apos;re looking for</h1>
);

export const Profile = ({ userId }: ProfileProps) => {
  const { resolvedTheme } = useTheme();
  const currentUser = useWorkspaceUser();
  const {
    data: { user },
  } = useSuspenseQuery(orpc.user.getUser.queryOptions({ input: { userId } }));
  const {
    data: { userStats },
  } = useSuspenseQuery(orpc.user.getUserStats.queryOptions({ input: { userId } }));
  const {
    data: { posts },
  } = useSuspenseQuery(orpc.post.getPostsByUser.queryOptions({ input: { userId } }));
  const isDesktop = useMediaQuery();

  if (!user) {
    return <ProfileNotFound />;
  }

  const allowEdit = currentUser ? currentUser.id === user.id : false;
  const dailyData = createPostsDailyActivity(posts);
  const heatmapData = createPostsHeatmap(posts, isDesktop ? 200 : 120);
  const theme = PROFILE_CALENDAR_THEMES[isDarkTheme(resolvedTheme) ? "dark" : "light"];

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-6 lg:grid-rows-2">
      <div className="lg:col-span-6">
        <Card className="lg:rounded-t-[calc(2rem+1px)]">
          <ProfileForm userId={userId} readonly={!allowEdit} />
          <div className="mx-auto">
            <ActivityCalendar data={heatmapData.stats} theme={theme} />
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
                <span className="text-primary">{FULL_DAY_LABELS[dailyData.max.day]}s</span>
              </>
            )}
          </h2>
          <ActivityWeek data={dailyData.stats} theme={theme} />
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
