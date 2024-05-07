import { redirect } from "next/navigation";
import {
  createPostsDailyActivity,
  createPostsHeatmap,
  getCurrentStreak,
  getLongestStreak,
  getTotalLikes,
  getTotalPosts,
} from "@init/api/lib/poststats";

import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { Profile } from "@/lib/user/ui/profile";
import { api } from "@/trpc/server";

type Props = {
  params: {
    id: string;
  };
};

const Page = async ({ params: { id } }: Props) => {
  const lastNDays = 200;
  const currentUser = await api.auth.me();
  const user = await api.user.byId({ id: id });
  const posts = await api.posts.all({ userId: id });

  if (!user) redirect("/profile");

  const showEdit = currentUser ? currentUser.id === id : false;

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
