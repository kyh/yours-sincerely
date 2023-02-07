import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { notFound, badRequest, serverError } from "remix-utils";
import {
  isAuthenticated,
  setUserSession,
} from "~/lib/auth/server/authenticator.server";
import { createLike, deleteLike } from "~/lib/post/server/likeService.server";
import {
  generateToken,
  createPasswordHash,
} from "~/lib/auth/server/authService.server";
import { commitSession, getSession } from "~/lib/core/server/session.server";

export const loader: LoaderFunction = () => {
  throw notFound({ message: "This page doesn't exists." });
};

export const action: ActionFunction = async ({ request, params }) => {
  const user = await isAuthenticated(request);
  const postId = params.pid;

  if (!postId) return badRequest({ message: "Invalid post" });

  try {
    if (request.method === "POST") {
      const tempPassword = generateToken();

      const like = await createLike({
        user: {
          connectOrCreate: {
            where: {
              id: user?.id || "",
            },
            create: {
              displayName: "Anonymous",
              passwordHash: await createPasswordHash(tempPassword),
            },
          },
        },
        post: {
          connect: {
            id: postId,
          },
        },
      });

      if (!user) {
        const session = await getSession(request);
        await setUserSession(session, like.user.id);
        const headers = await commitSession(session);

        return json({ success: true }, { headers });
      }
    }

    if (request.method === "DELETE" && user?.id) {
      await deleteLike({ userId: user.id, postId });
    }

    return json({ success: true });
  } catch (error) {
    if (error instanceof Error) return badRequest({ message: error.message });
    return serverError({ message: "Something went wrong" });
  }
};
