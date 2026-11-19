import { and, eq } from "@repo/db";
import { like } from "@repo/db/drizzle-schema";
import { ORPCError } from "@orpc/server";

import type { ORPCContext } from "../orpc";
import { createUserIfNotExists } from "../auth/auth-utils";
import { os, requireUser } from "../orpc";
import { FOREIGN_KEY_VIOLATION, rethrowPgError } from "../pg-error";

const postNotFound = () => new ORPCError("NOT_FOUND", { message: "Post not found" });

const insertLike = async (context: ORPCContext, postId: string, userId: string) => {
  const [created] = await rethrowPgError(
    context.db.insert(like).values({ postId, userId }).onConflictDoNothing().returning(),
    FOREIGN_KEY_VIOLATION,
    postNotFound,
  );

  return created;
};

const readLikeState = async (context: ORPCContext, postId: string, isLiked: boolean) => {
  const row = await context.db.query.post.findFirst({
    columns: { baseLikeCount: true, id: true, likeCount: true },
    where: { id: postId },
  });

  return row === undefined
    ? undefined
    : { id: row.id, isLiked, likeCount: (row.baseLikeCount ?? 0) + row.likeCount };
};

const authed = os.like.use(requireUser);

export const likeRouter = {
  createLike: os.like.createLike.handler(async ({ context, input }) => {
    const userId = await createUserIfNotExists(context);

    const created = await insertLike(context, input.postId, userId);

    const existing =
      created ??
      (await context.db.query.like.findFirst({
        where: { postId: input.postId, userId },
      }));

    return {
      like: existing,
      post: await readLikeState(context, input.postId, existing !== undefined),
    };
  }),

  deleteLike: authed.deleteLike.handler(async ({ context, input }) => {
    const [deleted] = await context.db
      .delete(like)
      .where(and(eq(like.userId, context.user.id), eq(like.postId, input.postId)))
      .returning();

    return {
      like: deleted,
      post: await readLikeState(context, input.postId, false),
    };
  }),
};
