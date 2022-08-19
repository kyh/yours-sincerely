import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { notFound, badRequest, serverError } from "remix-utils";
import { flashAndCommit } from "~/lib/core/server/session.server";
import { isAuthenticated } from "~/lib/auth/server/authenticator.server";
import type { Post } from "~/lib/post/data/postSchema";
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

  if (!userId || !postId) return badRequest({ message: "Invalid post" });

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

    const headers = await flashAndCommit(
      request,
      "Your comment has been added"
    );

    return json({ success: true }, { headers });
  } catch (error) {
    if (error instanceof Error) return badRequest({ message: error.message });
    return serverError({ message: "Something went wrong" });
  }
};
