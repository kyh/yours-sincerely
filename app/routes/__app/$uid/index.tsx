import { LoaderFunction, MetaFunction, useLoaderData, redirect } from "remix";
import { createMeta } from "~/lib/core/util/meta";
import { links as activityCalendarLinks, Day } from "~/lib/core/ui/Activity";
import { User } from "~/lib/user/data/userSchema";
import { Profile } from "~/lib/user/ui/Profile";
import { isAuthenticated } from "~/lib/auth/server/authenticator.server";
import { getUser } from "~/lib/user/server/userService.server";
import { getAllPostsForUser } from "~/lib/post/server/postService.server";
import {
  createPostsHeatmap,
  createPostsDailyActivity,
  getTotalPosts,
  getTotalLikes,
  getCurrentStreak,
  getLongestStreak,
} from "~/lib/post/data/postStats";

type LoaderData = {
  user: User;
  showEdit: boolean;
  stats: {
    heatmap: { stats: Day[]; max: number };
    daily: {
      stats: Record<string, { count: number; level: number }>;
      max: { max: number; day: string };
    };
    posts: number;
    likes: number;
    currentStreak: number;
    longestStreak: number;
  };
};

export const links = () => {
  return [...activityCalendarLinks()];
};

export const meta: MetaFunction = ({ data }: { data: LoaderData }) => {
  return createMeta({
    title: `${data.user?.displayName || "Anonymous"}'s Profile`,
  });
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const lastNDays = 200;
  const currentUser = await isAuthenticated(request);
  const user = await getUser({ id: params.uid });
  const posts = await getAllPostsForUser(params.uid!);

  if (!user) throw redirect(`/profile`);

  const data: LoaderData = {
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
  };

  return data;
};

const Page = () => {
  const { user, stats, showEdit } = useLoaderData<LoaderData>();

  return (
    <main className="w-full max-w-md py-5 mx-auto">
      <Profile user={user} stats={stats} showEdit={showEdit} />
    </main>
  );
};

export default Page;
