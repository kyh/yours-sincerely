import { ActionFunction, LoaderFunction, redirect } from "remix";
import { authenticator } from "~/lib/auth/server/middleware/auth.server";

export const loader: LoaderFunction = () => redirect("/auth/login");

export const action: ActionFunction = async ({ request }) => {
  return authenticator.authenticate("google", request);
};
