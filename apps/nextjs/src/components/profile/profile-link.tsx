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
  const { data, isLoading } = api.posts.all.useQuery({ userId: userId });

  return (
    <div className="flow-root rounded-md not-italic">
      <h4 className="mb-2 text-center font-bold text-slate-900 dark:text-slate-50">
        {displayName}
      </h4>
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
          <div className="h-[136px] w-[204px] rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      )}
    </div>
  );
};

export const ProfileLink = ({ userId, displayName, className = "" }: Props) => {
  return (
    <Tooltip>
      <TooltipTrigger
        className={`inline-flex text-slate-900 underline decoration-dotted underline-offset-2 dark:text-slate-50 ${className}`}
      >
        {displayName}
      </TooltipTrigger>
      <TooltipContent asChild>
        <Link
          href={`/${userId}`}
          className="max-w-[240px] overflow-hidden rounded-lg bg-white p-4 shadow-lg hover:no-underline dark:bg-zinc-900"
        >
          <ProfileTooltip userId={userId} displayName={displayName} />
        </Link>
      </TooltipContent>
    </Tooltip>
  );
};
