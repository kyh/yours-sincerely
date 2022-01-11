import type { ActionFunction, LoaderFunction } from "remix";
import { authenticator } from "~/lib/auth/server/middleware/auth.server";

export const loader: LoaderFunction = () => {
  throw new Response("", { status: 404 });
};

export const action: ActionFunction = async ({ request }) => {
  return authenticator.logout(request, { redirectTo: "/login" });
};
