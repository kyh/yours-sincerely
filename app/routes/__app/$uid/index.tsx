import type { LoaderArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { links as activityCalendarLinks } from "~/components/Activity";
import { isAuthenticated } from "~/lib/auth/server/authenticator.server";
import { createMeta } from "~/lib/core/util/meta";
import {
  createPostsDailyActivity,
  createPostsHeatmap,
  getCurrentStreak,
  getLongestStreak,
  getTotalLikes,
  getTotalPosts,
} from "~/lib/post/data/postStats";
import { getAllPostsForUser } from "~/lib/post/server/postService.server";
import type { User } from "~/lib/user/data/userSchema";
import { getUser } from "~/lib/user/server/userService.server";
import { Profile } from "~/lib/user/ui/Profile";

export const links = () => {
  return [...activityCalendarLinks()];
};

export const meta: MetaFunction = ({ data }: { data: { user: User } }) => {
  return createMeta({
    title: `${data.user?.displayName || "Anonymous"}'s Profile`,
  });
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const lastNDays = 200;
  const currentUser = await isAuthenticated(request);
  const user = await getUser({ id: params.uid });
  const posts = await getAllPostsForUser(params.uid!);

  if (!user) throw redirect(`/profile`);

  return json({
    user,
    showEdit: currentUser && user ? currentUser.id === user.id : false,
    stats: {
      heatmap: createPostsHeatmap(posts, lastNDays),
      daily: createPostsDailyActivity(posts),
      posts: getTotalPosts(posts),
      likes: getTotalLikes(posts),
      longestStreak: getLongestStreak(posts),
      currentStreak: getCurrentStreak(posts),
    },
  });
};

const Page = () => {
  const { user, stats, showEdit } = useLoaderData<typeof loader>();

  return (
    <main className="mx-auto w-full max-w-md py-5">
      <Profile user={user} stats={stats} showEdit={showEdit} />
    </main>
  );
};

export default Page;
