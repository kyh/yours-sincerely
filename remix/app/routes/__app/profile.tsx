import { LoaderFunction, ActionFunction, useLoaderData, json } from "remix";
import {
  getSession,
  commitSession,
} from "~/lib/auth/server/middleware/session.server";
import {
  authenticator,
  isAuthenticated,
} from "~/lib/auth/server/middleware/auth.server";
import { updateUser } from "~/lib/user/server/userService.server";
import { User } from "~/lib/user/data/userSchema";
import { Profile } from "~/lib/user/ui/Profile";
import { NoProfile } from "~/lib/user/ui/NoProfile";

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
  const updatedUser = await updateUser({ ...input, id: user.id });

  return json(updatedUser);
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
