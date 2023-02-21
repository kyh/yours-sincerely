import type { LoaderArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { isAuthenticated } from "~/lib/auth/server/authenticator.server";
import { createMeta } from "~/lib/core/util/meta";
import { NoProfile } from "~/lib/user/ui/NoProfile";

export let meta: MetaFunction = () => {
  return createMeta({
    title: `Profile`,
  });
};

export const loader = async ({ request }: LoaderArgs) => {
  const user = await isAuthenticated(request);
  if (user) throw redirect(`/${user.id}`);
  return json({ user: null });
};

const Page = () => {
  return (
    <main className="pt-5">
      <NoProfile />
    </main>
  );
};

export default Page;
