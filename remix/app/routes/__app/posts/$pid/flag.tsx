import { ActionFunction, LoaderFunction, redirect, json } from "remix";
import { isAuthenticated } from "~/lib/auth/server/middleware/auth.server";
import { createFlag, deleteFlag } from "~/lib/post/server/flagService.server";

export const loader: LoaderFunction = () => {
  throw new Response("", { status: 404 });
};

export const action: ActionFunction = async ({ request, params }) => {
  const user = await isAuthenticated(request);
  const userId = user?.id;
  const postId = params.pid;

  if (!userId || !postId) return json({ success: false }, { status: 400 });

  try {
    if (request.method === "POST") {
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

    if (request.method === "DELETE") {
      await deleteFlag({ userId, postId });
    }

    return redirect("/");
  } catch (error) {
    console.error(error);
    return json({ success: false, error }, { status: 500 });
  }
};
