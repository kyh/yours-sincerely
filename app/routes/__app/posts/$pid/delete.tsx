import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { notFound, badRequest, serverError } from "remix-utils";
import { flashAndCommit } from "~/lib/core/server/session.server";
import { isAuthenticated } from "~/lib/auth/server/authenticator.server";
import { deletePost } from "~/lib/post/server/postService.server";

export const loader: LoaderFunction = () => {
  throw notFound({ message: "This page doesn't exists." });
};

export const action: ActionFunction = async ({ request, params }) => {
  const user = await isAuthenticated(request);
  const userId = user?.id;
  const postId = params.pid;

  if (!userId || !postId) return badRequest({ message: "Invalid post" });

  try {
    if (request.method === "POST") {
      await deletePost({ id: postId });
    }

    const headers = await flashAndCommit(request, "Your post has been removed");

    return redirect("/", { headers });
  } catch (error) {
    if (error instanceof Error) return badRequest({ message: error.message });
    return serverError({ message: "Something went wrong" });
  }
};
