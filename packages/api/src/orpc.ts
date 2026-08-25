/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the oRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */
import { SESSION_COOKIE_NAME } from "@repo/contracts/auth";
import { db } from "@repo/db/drizzle-client";
import { ORPCError, os } from "@orpc/server";
import { getCookie } from "@orpc/server/helpers";

import { authenticateSessionValue, renewSessionIfStale } from "./auth/session";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * Callers supply headers rather than having them read here, so the same code
 * serves the route handler, the in-process RSC router client, and tests, which
 * have no shared request object.
 *
 * @see https://orpc.dev/docs/context
 */
export const createORPCContext = async (opts: { headers: Headers }) => {
  const sessionValue = getCookie(opts.headers, SESSION_COOKIE_NAME);

  // Resolves the cookie AND enforces the session epoch: a session revoked by a
  // password reset or "sign out everywhere" yields no user. Reuses the user row
  // the context loads anyway, so the check costs zero extra queries.
  const user = await authenticateSessionValue(sessionValue, findDbUser);

  // Renewal is gated behind a valid session and re-signs with the epoch from
  // the DATABASE, so a revoked session can never renew itself back into
  // validity. The cookie write inside is a no-op outside a Next request scope.
  if (user) {
    await renewSessionIfStale(sessionValue, user.sessionEpoch);
  }

  return {
    headers: opts.headers,
    user,
    db,
  };
};

/** Excludes only `passwordHash`, so `sessionEpoch` comes through. */
const findDbUser = async (userId: string) => {
  const user = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, userId),
    columns: { passwordHash: false },
  });

  return user ?? null;
};

export type ORPCContext = Awaited<ReturnType<typeof createORPCContext>>;

/**
 * 2. INITIALIZATION
 *
 * This is where the oRPC api is initialized, connecting the context. Errors
 * thrown as plain `Error` (a raw Postgres exception, say) are never serialized
 * to the client — oRPC turns them into a generic INTERNAL_SERVER_ERROR — so
 * the route handler's log is the only place the real cause survives.
 */
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
