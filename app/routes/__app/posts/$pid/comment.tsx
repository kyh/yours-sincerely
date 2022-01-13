import { ActionFunction, LoaderFunction, json } from "remix";
import { notFound } from "remix-utils";
import { isAuthenticated } from "~/lib/auth/server/authenticator.server";
import { Post } from "~/lib/post/data/postSchema";
import { createPost } from "~/lib/post/server/postService.server";

export const loader: LoaderFunction = () => {
  throw notFound({ message: "This page doesn't exists." });
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
