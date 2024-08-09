"use client";

import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@init/ui/tooltip";

import {
  getCurrentStreak,
  getLongestStreak,
  getTotalLikes,
  getTotalPosts,
} from "@/lib/stats";
import { api } from "@/trpc/react";
import { ActivityStats } from "./activity-stats";

type Props = {
  userId: string;
  displayName: string;
  className?: string;
};

const ProfileTooltip = ({
  userId,
  displayName,
}: {
  userId: string;
  displayName: string;
}) => {
  const { data, isLoading } = api.post.all.useQuery({ userId: userId });

  return (
    <div className="flow-root">
      <h4 className="mb-2 text-center font-bold">{displayName}</h4>
      {!isLoading && data ? (
        <ActivityStats
          data={{
            posts: getTotalPosts(data),
            likes: getTotalLikes(data),
            longestStreak: getLongestStreak(data),
            currentStreak: getCurrentStreak(data),
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
        {displayName}
      </TooltipTrigger>
      <TooltipContent>
        <Link href={`/${userId}`}>
          <ProfileTooltip userId={userId} displayName={displayName} />
        </Link>
      </TooltipContent>
    </Tooltip>
  );
};
