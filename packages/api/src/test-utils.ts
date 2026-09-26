import assert from "node:assert/strict";
import { db } from "@repo/db/drizzle-client";
import { createRouterClient } from "@orpc/server";

import type { ORPCContext } from "./orpc";
import { findSessionUser } from "./auth/session-user";
import { appRouter } from "./root-router";

/**
 * Calls the router in-process against the real database, running the real
 * middleware chain. `null` is the anonymous caller — the one a permalink or an
 * unauthenticated feed request actually gets.
 *
 * One builder so the context literal exists once: a field added to
 * `createORPCContext` is added here, not in every integration suite.
 */
export const createCaller = (user: ORPCContext["user"]) =>
  createRouterClient(appRouter, { context: { db, user } });

/**
 * Loads a user and calls as them through the request context's own lookup, so
 * a test caller can never carry a field the shipped one lacks.
 */
export const callerFor = async (userId: string) => {
  const actor = await findSessionUser(db, userId);
  assert.ok(actor);

  return createCaller(actor);
};

/**
 * The routers write the session cookie via `next/headers`, which throws outside
 * a Next request scope. Every database effect runs BEFORE that write, so the
 * mutation is driven for real and only that one specific error is absorbed.
 * Anything else rethrows.
 */
export const runWithoutCookieScope = async <T>(operation: () => Promise<T>) => {
  try {
    await operation();
    return "completed";
  } catch (error) {
    if (error instanceof Error && error.message.includes("outside a request scope")) {
      return "reached-cookie-write";
    }
    throw error;
  }
};
