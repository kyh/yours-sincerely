import { contract } from "@repo/contract";
import { SESSION_COOKIE_NAME } from "@repo/contract/auth/auth-schema";
import { db } from "@repo/db/drizzle-client";
import { implement, ORPCError, os as builder } from "@orpc/server";
import { getCookie } from "@orpc/server/helpers";

import { authenticateSessionValue, renewSessionIfStale } from "./auth/session";
import { findSessionUser } from "./auth/session-user";

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
  const sessionUser = await authenticateSessionValue(sessionValue, (userId) =>
    findSessionUser(db, userId),
  );

  // Renewal is gated behind a valid session and re-signs with the epoch from
  // the DATABASE, so a revoked session can never renew itself back into
  // validity. The cookie write inside is a no-op outside a Next request scope.
  if (sessionUser) {
    await renewSessionIfStale(sessionValue, sessionUser.sessionEpoch);
  }

  return { db, user: sessionUser };
};

export type ORPCContext = Awaited<ReturnType<typeof createORPCContext>>;

/**
 * Implements `@repo/contract`. Routers are plain objects of
 * `os.<router>.<procedure>` implementations; only `root-router.ts` calls
 * `os.router()`, which fails to compile if a contract procedure is missing or
 * mistyped. A router-level `.router()` would re-apply implementer middleware.
 */
export const os = implement(contract).$context<ORPCContext>();

const base = builder.$context<ORPCContext>();

/**
 * Requires a session, and narrows `context.user` to non-nullable for the
 * handler. Pairs with `protectedBase`.
 *
 * Apply it on the implementer (`os.<router>.use(requireUser)`), where it runs
 * before input validation. Used on the procedure, it runs after input
 * validation, so an anonymous malformed call answers 400, not 401.
 *
 * @see https://orpc.dev/docs/contract/implementation
 */
export const requireUser = base.middleware(({ context, next }) => {
  if (!context.user) {
    throw new ORPCError("UNAUTHORIZED");
  }

  return next({
    context: {
      user: context.user,
    },
  });
});
