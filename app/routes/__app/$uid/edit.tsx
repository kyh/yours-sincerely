import {
  LoaderFunction,
  ActionFunction,
  json,
  redirect,
  MetaFunction,
  useLoaderData,
} from "remix";
import { isAuthenticated } from "~/lib/auth/server/authenticator.server";
import { getUser, updateUser } from "~/lib/user/server/userService.server";
import { createMeta } from "~/lib/core/util/meta";
import { User } from "~/lib/user/data/userSchema";
import { EditProfile } from "~/lib/user/ui/EditProfile";

type LoaderData = {
  user: User;
  allowEdit: boolean;
};

export let meta: MetaFunction = () => {
  return createMeta({
    title: "Edit Profile",
  });
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const currentUser = await isAuthenticated(request);
  const user = await getUser({ id: params.uid });
  const allowEdit = currentUser && user ? currentUser.id === user.id : false;

  if (!user || !allowEdit) throw redirect(`/${user ? user.id : "/profile"}`);

  const data: LoaderData = {
    user,
    allowEdit,
  };

  return data;
};

export const action: ActionFunction = async ({ request }) => {
  const user = await isAuthenticated(request);
  if (!user) return json({ success: false });

  const input = Object.fromEntries(await request.formData()) as Partial<User>;

  await updateUser({
    ...input,
    // @ts-expect-error
    weeklyDigestEmail: input.weeklyDigestEmail === "true",
    id: user.id,
  });

  return redirect("/");
};

const Page = () => {
  const { user } = useLoaderData<LoaderData>();
  return (
    <main className="w-full max-w-md pt-5 mx-auto">
      <EditProfile user={user} />
    </main>
  );
};

export default Page;
