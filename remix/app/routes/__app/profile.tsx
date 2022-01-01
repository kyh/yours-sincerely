import { LoaderFunction, ActionFunction, useLoaderData, json } from "remix";
import {
  getSession,
  commitSession,
} from "~/lib/auth/server/middleware/session.server";
import { authenticator } from "~/lib/auth/server/middleware/auth.server";
import { updateUser } from "~/lib/user/server/userService.server";
import { User } from "~/lib/user/data/userSchema";
import { Profile } from "~/lib/user/ui/Profile";
import { NoProfile } from "~/lib/user/ui/NoProfile";

type LoaderData = {
  user: User | null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);
  const data: LoaderData = {
    user,
  };

  return data;
};

export const action: ActionFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);
  if (!user) return json({ success: false });

  const { name } = Object.fromEntries(await request.formData()) as User;
  const updatedUser = await updateUser({ id: user.id, name });

  // TODO: we currently manually update the session because the entire user object is stored there. we may want a wrapper around `authenticator.isAuthenticated` and fetch the user object on every request
  const session = await getSession(request);
  session.set(authenticator.sessionKey, updatedUser);
  const headers = new Headers({ "Set-Cookie": await commitSession(session) });

  return json(updatedUser, { headers });
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
