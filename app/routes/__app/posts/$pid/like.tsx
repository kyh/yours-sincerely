import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { notFound, badRequest, serverError } from "remix-utils";
import { isAuthenticated } from "~/lib/auth/server/authenticator.server";
import { createLike, deleteLike } from "~/lib/post/server/likeService.server";

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
      await createLike({
        user: {
          connect: {
            id: userId,
          },
        },
        post: {
          connect: {
            id: postId,
          },
        },
      });
    }

    if (request.method === "DELETE") {
      await deleteLike({ userId, postId });
    }

    return json({ success: true });
  } catch (error) {
    if (error instanceof Error) return badRequest({ message: error.message });
    return serverError({ message: "Something went wrong" });
  }
};
