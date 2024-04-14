"use client"

import Link from "next/link";
import { useEffect, useState } from "react";
import { ActivityStats } from "./activity";
import { Tooltip } from "./tooltip";
import { api } from "@/trpc/react";
import { getCurrentStreak, getLongestStreak, getTotalLikes, getTotalPosts } from "@/lib/post/data/poststats";
import type { Post } from "@/lib/post/data/postschema";

type Props = {
  userId: string;
  displayName: string;
  className?: string;
};

const ProfileTooltip = ({
  userId,
  displayName
}: {
  userId: string;
  displayName: string;
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const data = api.posts.all.useQuery({ userId: userId });
  useEffect(() => {
    data.refetch().then(res => setPosts(res.data!)).catch(err => console.log(err));
  }, [])

  const stats = {
    posts: getTotalPosts(posts),
    likes: getTotalLikes(posts),
    longestStreak: getLongestStreak(posts),
    currentStreak: getCurrentStreak(posts),
  };

  return (
    <div className="flow-root rounded-md not-italic">
      <h4 className="mb-2 text-center font-bold text-slate-900 dark:text-slate-50">
        {displayName}
      </h4>
      {stats ? (
        <ActivityStats data={stats} stack />
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
    <Tooltip
      offset={[0, 8]}
      triggerContent={displayName}
      triggerClassName={`inline-flex text-slate-900 underline underline-offset-2 decoration-dotted dark:text-slate-50 ${className}`}
      tooltipContent={
        <Link href={`/${userId}`} className="hover:no-underline">
          <ProfileTooltip userId={userId} displayName={displayName} />
        </Link>
      }
      tooltipClassName="max-w-[240px] p-4 overflow-hidden bg-white rounded-lg shadow-lg dark:bg-zinc-900"
    />
  );
};
