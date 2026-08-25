import { and, eq } from "@repo/db";
import { like } from "@repo/db/drizzle-schema";
import { getDefaultValues } from "@repo/db/utils";

import { createUserIfNotExists } from "../auth/auth-utils";
import { protectedProcedure, publicProcedure } from "../orpc";
import { createLikeInput, deleteLikeInput } from "./like-schema";

export const likeRouter = {
  createLike: publicProcedure.input(createLikeInput).handler(async ({ context, input }) => {
    const userId = await createUserIfNotExists(context);

    // Like_pkey is (postId, userId). A double-tap is an ordinary thing for a
    // user to do and must be a no-op, not a unique-violation 500.
    const [created] = await context.db
      .insert(like)
      .values({
        ...getDefaultValues({ withId: false }),
        postId: input.postId,
        userId,
      })
      .onConflictDoNothing()
      .returning();

    // `onConflictDoNothing().returning()` yields nothing when the row already
    // existed, so read it back rather than handing the client an `undefined`.
    const existing =
      created ??
      (await context.db.query.like.findFirst({
        where: (row, { and, eq }) => and(eq(row.postId, input.postId), eq(row.userId, userId)),
      }));

    return {
      like: existing,
    };
  }),

  deleteLike: protectedProcedure.input(deleteLikeInput).handler(async ({ context, input }) => {
    const [deleted] = await context.db
      .delete(like)
      .where(and(eq(like.userId, context.user.id), eq(like.postId, input.postId)))
      .returning();

    return {
      like: deleted,
    };
  }),
};
