import { and, eq } from "@repo/db";
import { like } from "@repo/db/drizzle-schema";
import { ORPCError } from "@orpc/server";

import type { ORPCContext } from "../orpc";
import { createUserIfNotExists } from "../auth/auth-utils";
import { protectedProcedure, publicProcedure } from "../orpc";
import { FOREIGN_KEY_VIOLATION, rethrowPgError } from "../pg-error";
import { createLikeInput, deleteLikeInput } from "./like-schema";

const postNotFound = () => new ORPCError("NOT_FOUND", { message: "Post not found" });

/** Like_pkey is (postId, userId). A double-tap is an ordinary thing for a
    user to do and must be a no-op, not a unique-violation 500. */
const insertLike = async (context: ORPCContext, postId: string, userId: string) => {
  // The author can delete the letter while it is still on the liker's screen.
  const [created] = await rethrowPgError(
    context.db.insert(like).values({ postId, userId }).onConflictDoNothing().returning(),
    FOREIGN_KEY_VIOLATION,
    postNotFound,
  );
  return created;
};

/** Read after the write, once the counter trigger has run, so a client can
    write the server's own number into its cache instead of refetching every
    feed page it has loaded. The total is the Feed view's: seeded offset plus
    real likes. */
const readLikeState = async (context: ORPCContext, postId: string, isLiked: boolean) => {
  const row = await context.db.query.post.findFirst({
    columns: { baseLikeCount: true, id: true, likeCount: true },
    where: { id: postId },
  });

  if (row === undefined) {
    throw postNotFound();
  }

  return { id: row.id, isLiked, likeCount: (row.baseLikeCount ?? 0) + row.likeCount };
};

export const likeRouter = {
  createLike: publicProcedure.input(createLikeInput).handler(async ({ context, input }) => {
    const userId = await createUserIfNotExists(context);

    const created = await insertLike(context, input.postId, userId);

    // `onConflictDoNothing().returning()` yields nothing when the row already
    // existed, so read it back rather than handing the client an `undefined`.
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

  deleteLike: protectedProcedure.input(deleteLikeInput).handler(async ({ context, input }) => {
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
