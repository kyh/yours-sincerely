import { ActionFunction, LoaderFunction, redirect, json } from "remix";
import { isAuthenticated } from "~/lib/auth/server/middleware/auth.server";
import { Post } from "~/lib/post/data/postSchema";
import { createPost } from "~/lib/post/server/postService.server";

export const loader: LoaderFunction = () => {
  throw new Response("", { status: 404 });
};

export const action: ActionFunction = async ({ request, params }) => {
  const user = await isAuthenticated(request);
  const formData = await request.formData();
  const { content } = Object.fromEntries(formData) as Post;

  const userId = user?.id;
  const postId = params.pid;

  if (!userId || !postId) return json({ success: false }, { status: 400 });

  try {
    if (request.method === "POST") {
      await createPost({
        content: content || "",
        createdBy: user.username || "Anonymous",
        parent: {
          connect: {
            id: postId,
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },
      });
    }

    return json({ success: true });
  } catch (error) {
    console.error(error);
    return json({ success: false, error }, { status: 500 });
  }
};
