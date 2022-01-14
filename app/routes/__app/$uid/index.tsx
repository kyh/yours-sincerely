import { useEffect } from "react";
import {
  LoaderFunction,
  MetaFunction,
  useLoaderData,
  json,
  redirect,
} from "remix";
import { ClientOnly } from "remix-utils";
import ReactTooltip from "react-tooltip";
import toast from "react-hot-toast";
import { createMeta } from "~/lib/core/util/meta";
import { links as activityCalendarLinks, Day } from "~/lib/core/ui/Activity";
import { User } from "~/lib/user/data/userSchema";
import { Profile } from "~/lib/user/ui/Profile";
import { getFlash } from "~/lib/core/server/session.server";
import { isAuthenticated } from "~/lib/auth/server/authenticator.server";
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
  message?: string;
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

  const { message, headers } = await getFlash(request);

  const data: LoaderData = {
    user,
    showEdit: currentUser && user ? currentUser.id === user.id : false,
    stats: {
      heatmap: createPostsHeatmap(user.posts, lastNDays),
      daily: createPostsDailyActivity(user.posts),
    },
    message,
  };

  return json(data, { headers });
};

const Page = () => {
  const { user, stats, showEdit, message } = useLoaderData<LoaderData>();

  useEffect(() => {
    if (message) toast(message);
  }, [message]);

  return (
    <main className="w-full max-w-md pt-5 mx-auto">
      <Profile user={user} stats={stats} showEdit={showEdit} />
      <ClientOnly>
        <ReactTooltip effect="solid" className="tooltip" />
      </ClientOnly>
    </main>
  );
};

export default Page;
