"use client";

import Link from "next/link";
import { resolveDisplayName } from "@repo/contracts/user";
import { ProfileAvatar } from "@/components/profile-avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@repo/ui/components/hover-card";
import { useQuery } from "@tanstack/react-query";

import { getAvatarUrl } from "@/lib/avatars";
import { orpc } from "@/orpc/react";
import { ActivityStats } from "./activity-stats";

interface Props {
  userId: string;
  displayName?: string | null;
}

const ProfilePreview = ({ userId, displayName }: Props) => {
  const { data, isLoading } = useQuery(orpc.user.getUserStats.queryOptions({ input: { userId } }));

  return (
    <div className="flex flex-col items-center gap-1 py-1.5 not-italic">
      <ProfileAvatar className="size-10" src={getAvatarUrl(displayName || userId)} />
      <h4 className="mb-1 text-center font-bold">{resolveDisplayName(displayName)}</h4>
      {!isLoading && data ? (
        <ActivityStats
          posts={data.userStats?.totalPostCount ?? 0}
          likes={data.userStats?.totalLikeCount ?? 0}
          longestStreak={data.userStats?.longestPostStreak ?? 0}
          currentStreak={data.userStats?.currentPostStreak ?? 0}
        />
      ) : (
        <div className="grid h-[104px] w-[180px] animate-pulse grid-cols-2 gap-2">
          <div className="bg-muted rounded" />
          <div className="bg-muted rounded" />
          <div className="bg-muted rounded" />
          <div className="bg-muted rounded" />
        </div>
      )}
    </div>
  );
};

export const ProfileLink = ({ userId, displayName }: Props) => (
  <HoverCard>
    <HoverCardTrigger
      className="inline-flex underline decoration-dotted underline-offset-2"
      render={<Link href={`/profile/${userId}`} />}
    >
      {resolveDisplayName(displayName)}
    </HoverCardTrigger>
    <HoverCardContent side="top" className="w-fit px-3 py-1.5 text-xs">
      <Link href={`/profile/${userId}`}>
        <ProfilePreview userId={userId} displayName={displayName} />
      </Link>
    </HoverCardContent>
  </HoverCard>
);
