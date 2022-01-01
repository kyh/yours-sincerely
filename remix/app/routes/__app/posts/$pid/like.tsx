import { ActionFunction, LoaderFunction, redirect, json } from "remix";
import { authenticator } from "~/lib/auth/server/middleware/auth.server";
import { createLike, deleteLike } from "~/lib/post/server/likeService.server";

export const loader: LoaderFunction = () => {
  throw new Response("", { status: 404 });
};

export const action: ActionFunction = async ({ request, params }) => {
  const user = await authenticator.isAuthenticated(request);
  const userId = user?.id;
  const postId = params.pid;

  if (userId && postId) {
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
  }

  return json({ success: false });
};
