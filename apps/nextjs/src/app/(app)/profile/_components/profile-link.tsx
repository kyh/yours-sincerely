"use client";

import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@init/ui/tooltip";

import { api } from "@/trpc/react";
import { ActivityStats } from "./activity-stats";

type Props = {
  userId: string;
  displayName?: string | null;
  className?: string;
};

const ProfileTooltip = ({ userId, displayName }: Props) => {
  const { data, isLoading } = api.user.getUserStats.useQuery({
    userId: userId,
  });

  return (
    <div className="flow-root">
      <h4 className="mb-2 text-center font-bold">{displayName}</h4>
      {!isLoading && data ? (
        <ActivityStats
          data={{
            posts: data.totalPostCount ?? 0,
            likes: data.totalLikeCount ?? 0,
            longestStreak: data.longestPostStreak ?? 0,
            currentStreak: data.currentPostStreak ?? 0,
          }}
          stack
        />
      ) : (
        <div className="animate-pulse">
          <div className="h-[136px] w-[204px] rounded" />
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
      <TooltipContent>
        <Link href={`/${userId}`}>
          <ProfileTooltip userId={userId} displayName={displayName} />
        </Link>
      </TooltipContent>
    </Tooltip>
  );
};
