import {
  LoaderFunction,
  ActionFunction,
  useLoaderData,
  json,
  redirect,
  MetaFunction,
} from "remix";
import { isAuthenticated } from "~/lib/auth/server/middleware/auth.server";
import { updateUser } from "~/lib/user/server/userService.server";
import { createMeta } from "~/lib/core/util/meta";
import { User } from "~/lib/user/data/userSchema";
import { Profile } from "~/lib/user/ui/Profile";
import { NoProfile } from "~/lib/user/ui/NoProfile";

export let meta: MetaFunction = () => {
  return createMeta({
    title: "Profile",
  });
};

type LoaderData = {
  user: User | null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await isAuthenticated(request);
  const data: LoaderData = {
    user,
  };

  return data;
};

export const action: ActionFunction = async ({ request }) => {
  const user = await isAuthenticated(request);
  if (!user) return json({ success: false });

  const input = Object.fromEntries(await request.formData()) as User;
  await updateUser({ ...input, id: user.id });

  const queryParams = new URLSearchParams(new URL(request.url).search);

  return redirect(queryParams.get("fromPath") || "/");
};

const Page = () => {
  const { user } = useLoaderData<LoaderData>();
  return (
    <main className="pt-5">
      {!user && <NoProfile />}
      {!!user && <Profile />}
    </main>
  );
};

export default Page;
