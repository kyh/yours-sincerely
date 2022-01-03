import { ActionFunction, LoaderFunction, redirect } from "remix";
import { authenticate } from "~/lib/auth/server/middleware/auth.server";

export const loader: LoaderFunction = () => redirect("/login");

export const action: ActionFunction = ({ request }) => {
  return authenticate("google", request);
};
