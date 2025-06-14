"use client";

import Link from "next/link";
import { ProfileAvatar } from "@repo/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/tooltip";
import { useQuery } from "@tanstack/react-query";

import { getAvatarUrl } from "@/lib/avatars";
import { useTRPC } from "@/trpc/react";
import { ActivityStats } from "./activity-stats";

type Props = {
  userId: string;
  displayName?: string | null;
  className?: string;
};

const ProfileTooltipContent = ({ userId, displayName }: Props) => {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.user.getUserStats.queryOptions({
      userId: userId,
    }),
  );

  return (
    <div className="flex flex-col items-center gap-1 py-1.5 not-italic">
      <ProfileAvatar
        className="size-10"
        src={getAvatarUrl(displayName || userId)}
      />
      <h4 className="mb-1 text-center font-bold">
        {displayName || "Anonymous"}
      </h4>
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

export const ProfileLink = ({ userId, displayName, className = "" }: Props) => {
  return (
    <Tooltip>
      <TooltipTrigger
        className={`inline-flex underline decoration-dotted underline-offset-2 ${className}`}
        asChild
      >
        <Link href={`/profile/${userId}`}>{displayName || "Anonymous"}</Link>
      </TooltipTrigger>
      <TooltipContent className="bg-popover text-popover-foreground shadow-md">
        <Link href={`/profile/${userId}`}>
          <ProfileTooltipContent userId={userId} displayName={displayName} />
        </Link>
      </TooltipContent>
    </Tooltip>
  );
};
