import { LoaderFunction, MetaFunction, useLoaderData, redirect } from "remix";
import ReactTooltip from "react-tooltip";
import { createMeta } from "~/lib/core/util/meta";
import { links as activityCalendarLinks, Day } from "~/lib/core/ui/Activity";
import { User } from "~/lib/user/data/userSchema";
import { Profile } from "~/lib/user/ui/Profile";
import { isAuthenticated } from "~/lib/auth/server/middleware/auth.server";
import { getUserWithPosts } from "~/lib/user/server/userService.server";
import {
  createPostsHeatmap,
  createPostsDailyActivity,
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
  const user = await getUserWithPosts({ id: params.uid }, lastNDays);

  if (!user) throw redirect(`/profile`);

  const data: LoaderData = {
    user,
    showEdit: currentUser && user ? currentUser.id === user.id : false,
    stats: {
      heatmap: createPostsHeatmap(user.posts, lastNDays),
      daily: createPostsDailyActivity(user.posts),
    },
  };

  return data;
};

const Page = () => {
  const { user, stats, showEdit } = useLoaderData<LoaderData>();
  return (
    <main className="pt-5">
      <Profile user={user} stats={stats} showEdit={showEdit} />
      <ReactTooltip effect="solid" className="tooltip" />
    </main>
  );
};

export default Page;
