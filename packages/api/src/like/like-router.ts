import { and, eq } from "@repo/db";
import { like } from "@repo/db/drizzle-schema";
import { getDefaultValues } from "@repo/db/utils";

import { createUserIfNotExists } from "../auth/auth-utils";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { createLikeInput, deleteLikeInput } from "./like-schema";

export const likeRouter = createTRPCRouter({
  createLike: publicProcedure.input(createLikeInput).mutation(async ({ ctx, input }) => {
    const userId = await createUserIfNotExists(ctx);

    // Like_pkey is (postId, userId). A double-tap is an ordinary thing for a
    // user to do and must be a no-op, not a unique-violation 500.
    const [created] = await ctx.db
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
      (await ctx.db.query.like.findFirst({
        where: (row, { and, eq }) => and(eq(row.postId, input.postId), eq(row.userId, userId)),
      }));

    return {
      like: existing,
    };
  }),

  deleteLike: protectedProcedure.input(deleteLikeInput).mutation(async ({ ctx, input }) => {
    const [deleted] = await ctx.db
      .delete(like)
      .where(and(eq(like.userId, ctx.user.id), eq(like.postId, input.postId)))
      .returning();

    return {
      like: deleted,
    };
  }),
});
