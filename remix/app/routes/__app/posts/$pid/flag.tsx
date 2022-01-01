import { ActionFunction, LoaderFunction, redirect, json } from "remix";
import { authenticator } from "~/lib/auth/server/middleware/auth.server";
import { createFlag, deleteFlag } from "~/lib/post/server/flagService.server";

export const loader: LoaderFunction = () => {
  throw new Response("", { status: 404 });
};

export const action: ActionFunction = async ({ request, params }) => {
  const user = await authenticator.isAuthenticated(request);
  const userId = user?.id;
  const postId = params.id;

  if (userId && postId) {
    if (request.method === "post") {
      await createFlag({
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

    if (request.method === "delete") {
      await deleteFlag({ userId, postId });
    }

    return json({ success: true });
  }

  return json({ success: false });
};
