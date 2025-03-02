import { user } from "@init/db/schema";
import { getDefaultValues } from "@init/db/utils";
import { TRPCError } from "@trpc/server";

import type { TRPCContext } from "../trpc";
import { createTempPassword, setDeprecatedSession } from "./deprecated-session";

export const createUserIfNotExists = async (
  ctx: TRPCContext,
  displayName?: string,
) => {
  let userId = ctx.user?.id;

  // If the user is not logged in, create an anonymous user
  if (!userId) {
    const [userData] = await ctx.db
      .insert(user)
      .values({
        ...getDefaultValues(),
        passwordHash: await createTempPassword(),
        displayName: displayName ?? "Anonymous",
      })
      .returning();

    if (!userData) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create user",
      });
    }

    userId = userData.id;

    await setDeprecatedSession(userId);
  }

  return userId;
};
