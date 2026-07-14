/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */
import { db } from "@repo/db/drizzle-client";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { getSessionUser, renewSessionIfStale } from "./auth/session";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  // Resolves the cookie AND enforces the session epoch: a session revoked by a
  // password reset or "sign out everywhere" yields no user. Reuses the user row
  // the context loads anyway, so the check costs zero extra queries.
  const user = await getSessionUser(findDbUser);

  // tRPC runs in a route handler, where cookie writes are allowed. Renewal is
  // gated behind a valid session and re-signs with the epoch from the DATABASE,
  // so a revoked session can never renew itself back into validity.
  if (user) {
    await renewSessionIfStale(user.sessionEpoch);
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

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => {
    // An INTERNAL_SERVER_ERROR is, by definition, something we did not model —
    // in practice a raw Postgres exception, whose message names constraints and
    // tables. Redact it for the client in production. The route handler still
    // console.errors the full error, so nothing is lost from the logs, and
    // development keeps the real message.
    const leaksInternals =
      error.code === "INTERNAL_SERVER_ERROR" && process.env.NODE_ENV === "production";

    return {
      ...shape,
      message: leaksInternals ? "Something went wrong" : shape.message,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      user: ctx.user,
    },
  });
});
