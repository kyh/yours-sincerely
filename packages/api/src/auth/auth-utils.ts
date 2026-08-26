import { user } from "@repo/db/drizzle-schema";
import { getDefaultValues } from "@repo/db/utils";
import { ORPCError } from "@orpc/server";

import type { ORPCContext } from "../orpc";
import { createTempPassword, setSession } from "./session";

export const createUserIfNotExists = async (context: ORPCContext, displayName?: string) => {
  let userId = context.user?.id;

  // If the user is not logged in, create an anonymous user
  if (!userId) {
    const [userData] = await context.db
      .insert(user)
      .values({
        ...getDefaultValues(),
        passwordHash: await createTempPassword(),
        displayName: displayName ?? "Anonymous",
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
