import { ActionFunction, LoaderFunction, redirect } from "remix";
import { authenticator } from "~/lib/auth/server/middleware/auth.server";

export const loader: LoaderFunction = () => {
  throw new Response("", { status: 404 });
};

export const action: ActionFunction = async ({ request }) => {
  return authenticator.authenticate("google", request);
};
