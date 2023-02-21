import type { ActionFunction, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { unauthorized } from "remix-utils";
import { isAuthenticated } from "~/lib/auth/server/authenticator.server";
import { flashAndCommit } from "~/lib/core/server/session.server";
import { createMeta } from "~/lib/core/util/meta";
import type { User } from "~/lib/user/data/userSchema";
import { getUser, updateUser } from "~/lib/user/server/userService.server";
import { EditProfile } from "~/lib/user/ui/EditProfile";

export let meta: MetaFunction = () => {
  return createMeta({
    title: "Edit Profile",
  });
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const currentUser = await isAuthenticated(request);
  const user = await getUser({ id: params.uid });
  const allowEdit = currentUser && user ? currentUser.id === user.id : false;

  if (!user || !allowEdit) throw redirect(`/${user ? user.id : "/profile"}`);

  return json({
    user,
    allowEdit,
  });
};

export const action: ActionFunction = async ({ request }) => {
  const user = await isAuthenticated(request);
  if (!user) return unauthorized({ message: "Cannot update profile" });

  const input = Object.fromEntries(await request.formData()) as Partial<User>;

  await updateUser({
    ...input,
    // @ts-expect-error
    weeklyDigestEmail: input.weeklyDigestEmail === "true",
    id: user.id,
  });

  const headers = await flashAndCommit(request, "User profile updated");

  return redirect(`/${user.id}`, { headers });
};

const Page = () => {
  const { user } = useLoaderData<typeof loader>();
  return (
    <main className="mx-auto w-full max-w-md pt-5">
      <EditProfile user={user} />
    </main>
  );
};

export default Page;
