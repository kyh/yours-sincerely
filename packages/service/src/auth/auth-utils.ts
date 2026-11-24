import { resolveDisplayName } from "@repo/contract/user/user-display";
import { user } from "@repo/db/drizzle-schema";
import { ORPCError } from "@orpc/server";

import type { ORPCContext } from "../orpc";
import { setSession } from "./session";

export const createUserIfNotExists = async (context: ORPCContext, displayName?: string) => {
  let userId = context.user?.id;

  if (!userId) {
    const [userData] = await context.db
      .insert(user)
      .values({
        displayName: resolveDisplayName(displayName),
      })
      .returning();

    if (!userData) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create user" });
    }

    userId = userData.id;

    await setSession(userId, userData.sessionEpoch);
  }

  return userId;
};
