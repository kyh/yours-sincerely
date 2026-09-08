import { SESSION_COOKIE_NAME } from "@repo/contracts/auth";
import { eq } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { user } from "@repo/db/drizzle-schema";
import { ORPCError, os } from "@orpc/server";
import { getCookie } from "@orpc/server/helpers";

import { authenticateSessionValue, renewSessionIfStale } from "./auth/session";

/** Excludes only `passwordHash`, so `sessionEpoch` comes through. */
const findDbUser = async (userId: string) => {
  const dbUser = await db.query.user.findFirst({
    columns: { passwordHash: false },
    where: eq(user.id, userId),
  });

  return dbUser ?? null;
};

/**
 * Builds the per-request context: the database, plus the caller's user when a
 * session cookie resolves to one.
 *
 * Callers supply headers rather than having them read here, so the same code
 * serves the route handler and the in-process RSC router client, which have no
 * shared request object.
 *
 * @see https://orpc.dev/docs/context
 */
export const createORPCContext = async (opts: { headers: Headers }) => {
  const sessionValue = getCookie(opts.headers, SESSION_COOKIE_NAME);

  // Resolves the cookie AND enforces the session epoch: a session revoked by a
  // password reset or "sign out everywhere" yields no user. Reuses the user row
  // the context loads anyway, so the check costs zero extra queries.
  const sessionUser = await authenticateSessionValue(sessionValue, findDbUser);

  // Renewal is gated behind a valid session and re-signs with the epoch from
  // the DATABASE, so a revoked session can never renew itself back into
  // validity. The cookie write inside is a no-op outside a Next request scope.
  if (sessionUser) {
    await renewSessionIfStale(sessionValue, sessionUser.sessionEpoch);
  }

  return { db, user: sessionUser };
};

export type ORPCContext = Awaited<ReturnType<typeof createORPCContext>>;

const o = os.$context<ORPCContext>();

/**
 * Unauthenticated procedure. Does not require a session, but `context.user` is
 * still populated when the caller happens to be logged in.
 */
export const publicProcedure = o;

/**
 * Requires a session, and narrows `context.user` to non-nullable for the
 * handler.
 *
 * @see https://orpc.dev/docs/procedure
 */
export const protectedProcedure = o.use(({ context, next }) => {
  if (!context.user) {
    throw new ORPCError("UNAUTHORIZED");
  }

  return next({
    context: {
      user: context.user,
    },
  });
});
