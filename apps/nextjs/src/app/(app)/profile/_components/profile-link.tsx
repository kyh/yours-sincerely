"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@init/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@init/ui/tooltip";

import { getAvatarUrl } from "@/lib/avatars";
import { api } from "@/trpc/react";
import { ActivityStats } from "./activity-stats";

type Props = {
  userId: string;
  displayName?: string | null;
  className?: string;
};

const ProfileTooltipContent = ({ userId, displayName }: Props) => {
  const { data, isLoading } = api.user.getUserStats.useQuery({
    userId: userId,
  });

  return (
    <div className="flex flex-col items-center gap-1 py-1.5 not-italic">
      <Avatar className="size-10">
        <AvatarImage
          className="dark:invert"
          src={getAvatarUrl(displayName || userId)}
          alt="Profile image"
        />
        <AvatarFallback>A</AvatarFallback>
      </Avatar>
      <h4 className="mb-1 text-center font-bold">
        {displayName || "Anonymous"}
      </h4>
      {!isLoading && data ? (
        <ActivityStats
          data={{
            posts: data.userStats?.totalPostCount ?? 0,
            likes: data.userStats?.totalLikeCount ?? 0,
            longestStreak: data.userStats?.longestPostStreak ?? 0,
            currentStreak: data.userStats?.currentPostStreak ?? 0,
          }}
          stack
        />
      ) : (
        <div className="grid h-[104px] w-[180px] animate-pulse grid-cols-2 gap-2">
          <div className="rounded bg-muted" />
          <div className="rounded bg-muted" />
          <div className="rounded bg-muted" />
          <div className="rounded bg-muted" />
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
      >
        {displayName || "Anonymous"}
      </TooltipTrigger>
      <TooltipContent className="bg-popover text-popover-foreground shadow-md">
        <Link href={`/profile/${userId}`}>
          <ProfileTooltipContent userId={userId} displayName={displayName} />
        </Link>
      </TooltipContent>
    </Tooltip>
  );
};
