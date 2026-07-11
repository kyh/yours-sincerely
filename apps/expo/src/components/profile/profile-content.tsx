import { ScrollView, useWindowDimensions, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import type { CalendarTheme as Theme } from "@repo/contracts/calendar";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { isDarkTheme, useTheme } from "@/components/theme-provider";
import {
  createPostsDailyActivity,
  createPostsHeatmap,
  FULL_DAY_LABELS,
} from "@repo/contracts/calendar";
import { trpc } from "@/lib/api";
import { useWorkspaceUser } from "@/lib/use-workspace-user";
import { cn } from "@/lib/utils";
import { CONTENT_COLUMN_STYLE } from "@/lib/layout";
import { ActivityCalendar } from "./activity-calendar";
import { ActivityStats } from "./activity-stats";
import { ActivityWeek } from "./activity-week";
import { ProfileForm } from "./profile-form";

/** Port of apps/web (app)/profile/_components/profile.tsx —
    same indigo palettes. */
const lightTheme: Theme = {
  level4: "#312e81",
  level3: "#4338ca",
  level2: "#6366f1",
  level1: "#a5b4fc",
  level0: "#e0e7ff",
  stroke: "#ddd6fe",
};

const darkTheme: Theme = {
  level4: "#6366f1",
  level3: "#4f46e5",
  level2: "#4338ca",
  level1: "#3730a3",
  level0: "#272567",
  stroke: "#312e81",
};

type Props = {
  userId: string;
};

export const ProfileContent = ({ userId }: Props) => {
  const { width } = useWindowDimensions();
  const { resolvedTheme } = useTheme();
  const { user: currentUser } = useWorkspaceUser();

  const userQuery = useQuery(trpc.user.getUser.queryOptions({ userId }));
  const statsQuery = useQuery(trpc.user.getUserStats.queryOptions({ userId }));
  const postsQuery = useQuery(trpc.post.getPostsByUser.queryOptions({ userId }));

  if (userQuery.isPending || statsQuery.isPending || postsQuery.isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  }

  if (userQuery.isError || statsQuery.isError || postsQuery.isError) {
    return (
      <QueryErrorState
        message="Couldn't load this profile. Check your connection and try again."
        onRetry={() => {
          Promise.all([userQuery.refetch(), statsQuery.refetch(), postsQuery.refetch()]).catch(
            () => undefined,
          );
        }}
      />
    );
  }

  const user = userQuery.data?.user;
  if (user === undefined || user === null) {
    return (
      <View className="flex-1 items-center justify-center px-5">
        <Text className="text-center">Hmm, can't seem to find the person you're looking for</Text>
      </View>
    );
  }

  const userStats = statsQuery.data?.userStats;
  const posts = postsQuery.data?.posts ?? [];

  const allowEdit = currentUser !== null && currentUser.id === user.id;
  const dailyData = createPostsDailyActivity(posts);
  const heatmapData = createPostsHeatmap(posts, 120);
  const theme = isDarkTheme(resolvedTheme) ? darkTheme : lightTheme;
  const favoriteDay = FULL_DAY_LABELS[dailyData.max.day];

  return (
    <ScrollView
      contentContainerClassName="gap-4 px-5 pb-10"
      contentContainerStyle={CONTENT_COLUMN_STYLE}
    >
      <Card>
        <ProfileForm userId={userId} readonly={!allowEdit} />
        <ActivityCalendar data={heatmapData.stats} theme={theme} />
      </Card>
      <View className={cn("gap-4", width >= 768 && "flex-row")}>
        <Card className="min-h-60 flex-1 items-center justify-center py-8">
          <Text className="text-sm font-bold">
            {dailyData.max.day === "none" ? (
              "No daily stats yet"
            ) : (
              <>
                Favorite day to write is on{" "}
                <Text className="text-primary text-sm font-bold">{favoriteDay}s</Text>
              </>
            )}
          </Text>
          <ActivityWeek data={dailyData.stats} theme={theme} />
        </Card>
        <Card className="min-h-60 flex-1 items-center justify-center py-8">
          <ActivityStats
            posts={userStats?.totalPostCount ?? 0}
            likes={userStats?.totalLikeCount ?? 0}
            currentStreak={userStats?.currentPostStreak ?? 0}
            longestStreak={userStats?.longestPostStreak ?? 0}
          />
        </Card>
      </View>
    </ScrollView>
  );
};
