import { cookies } from "next/headers";
import { redirect } from "next/navigation";
// supabase auth
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { PageContent, PageHeader } from "@/components/page-layout";
import {
  createPostsDailyActivity,
  createPostsHeatmap,
  getCurrentStreak,
  getLongestStreak,
  getTotalLikes,
  getTotalPosts,
} from "@/lib/post/data/poststats";
import { Profile } from "@/lib/user/ui/profile";
import { api } from "@/trpc/server";

type Props = {
  params: {
    uid: string;
  };
};

const Page = async ({ params: { uid } }: Props) => {
  const lastNDays = 200;
  const currentUser = await api.auth.me();
  const user = await api.user.byId({ uid: uid });
  const posts = await api.posts.all({ userId: uid });

  if (!user) redirect("/profile");

  const showEdit = currentUser ? currentUser.id === uid : false;

  const stats = {
    heatmap: createPostsHeatmap(posts, lastNDays),
    daily: createPostsDailyActivity(posts),
    posts: getTotalPosts(posts),
    likes: getTotalLikes(posts),
    longestStreak: getLongestStreak(posts),
    currentStreak: getCurrentStreak(posts),
  };

  return (
    <>
      <PageHeader title="Profile" />
      <PageContent>
        <Profile user={user} stats={stats} showEdit={showEdit} />
      </PageContent>
    </>
  );
};

export default Page;
