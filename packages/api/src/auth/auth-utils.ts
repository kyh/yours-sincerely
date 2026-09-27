import { resolveDisplayName } from "@repo/contracts/user";
import { user } from "@repo/db/drizzle-schema";
import { ORPCError } from "@orpc/server";

import type { ORPCContext } from "../orpc";
import { setSession } from "./session";

export const createUserIfNotExists = async (context: ORPCContext, displayName?: string) => {
  let userId = context.user?.id;

  // If the user is not logged in, create an anonymous user. No `passwordHash`:
  // with no email there is no sign-in that could ever check one, and bcrypt
  // here would cost every first write ~70ms of CPU.
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
