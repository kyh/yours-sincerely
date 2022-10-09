import { json, redirect } from "@remix-run/node";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";

import type { PostView } from "~/lib/core/server/session.server";
import { setPostViewAndCommit } from "~/lib/core/server/session.server";

export const action: ActionFunction = async ({ request }) => {
  const requestText = await request.text();
  const form = new URLSearchParams(requestText);
  const postView = form.get("view") as PostView;

  const headers = await setPostViewAndCommit(request, postView);

  return json({ success: true }, { headers });
};

export const loader: LoaderFunction = () => redirect("/", { status: 404 });
