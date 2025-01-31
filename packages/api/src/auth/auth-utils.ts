import { user } from "@init/db/schema";
import { getDefaultValues } from "@init/db/utils";

import type { Context } from "../trpc";
import { createTempPassword, setDeprecatedSession } from "./deprecated-session";

export const createUserIfNotExists = async (
  ctx: Context,
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
      throw new Error("Failed to create user");
    }

    userId = userData.id;

    await setDeprecatedSession(userId);
  }

  return userId;
};
