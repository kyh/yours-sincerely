import { flag } from "@repo/db/drizzle-schema";
import { ORPCError } from "@orpc/server";

import { createUserIfNotExists } from "../auth/auth-utils";
import { os } from "../orpc";
import { FOREIGN_KEY_VIOLATION, rethrowPgError } from "../pg-error";

export const flagRouter = {
  createFlag: os.flag.createFlag.handler(async ({ context, input }) => {
    const userId = await createUserIfNotExists(context);

    // WARNING: never set countsTowardHide here; the flag_counts_toward_hide trigger decides it.
    await rethrowPgError(
      context.db
        .insert(flag)
        .values({
          comment: input.reason,
          postId: input.postId,
          userId,
        })
        .onConflictDoNothing(),
      FOREIGN_KEY_VIOLATION,
      () => new ORPCError("NOT_FOUND", { message: "Post not found" }),
    );

    // WARNING: return only the key; the row would tell an identity minter which identities carry moderation authority.
    return {
      flag: { postId: input.postId },
    };
  }),
};
