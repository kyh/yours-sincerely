"use client";

import Link from "next/link";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip";
import { useQuery } from "@tanstack/react-query";

import { getAvatarUrl } from "@/lib/avatars";
import { orpc } from "@/orpc/react";
import { ActivityStats } from "./activity-stats";

type Props = {
  userId: string;
  displayName?: string | null;
};

const ProfileTooltipContent = ({ userId, displayName }: Props) => {
  const { data, isLoading } = useQuery(orpc.user.getUserStats.queryOptions({ input: { userId } }));

  return (
    <div className="flex flex-col items-center gap-1 py-1.5 not-italic">
      <ProfileAvatar className="size-10" src={getAvatarUrl(displayName || userId)} />
      <h4 className="mb-1 text-center font-bold">{displayName || "Anonymous"}</h4>
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

export const ProfileLink = ({ userId, displayName }: Props) => {
  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex underline decoration-dotted underline-offset-2"
        render={<Link href={`/profile/${userId}`} />}
      >
        {displayName || "Anonymous"}
      </TooltipTrigger>
      <TooltipContent
        className="bg-popover text-popover-foreground shadow-md"
        arrowClassName="bg-popover fill-popover"
      >
        <Link href={`/profile/${userId}`}>
          <ProfileTooltipContent userId={userId} displayName={displayName} />
        </Link>
      </TooltipContent>
    </Tooltip>
  );
};
