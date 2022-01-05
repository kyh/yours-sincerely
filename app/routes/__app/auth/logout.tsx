import type { ActionFunction, LoaderFunction } from "remix";
import { redirect } from "remix";
import {
  getSession,
  destroySession,
} from "~/lib/auth/server/middleware/session.server";

export const loader: LoaderFunction = () => {
  throw new Response("", { status: 404 });
};

export const action: ActionFunction = async ({ request }) => {
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(await getSession(request)),
    },
  });
};
