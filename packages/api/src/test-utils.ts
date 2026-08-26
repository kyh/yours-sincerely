import assert from "node:assert/strict";
import { db } from "@repo/db/drizzle-client";
import { createRouterClient } from "@orpc/server";

import type { ORPCContext } from "./orpc";
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
  createRouterClient(appRouter, { context: { user, db } });

/**
 * Loads a user and calls as them. Excludes `passwordHash` exactly as the
 * request context does, so a test caller can never carry a field the shipped
 * one lacks.
 */
export const callerFor = async (userId: string) => {
  const actor = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, userId),
    columns: { passwordHash: false },
  });
  assert.ok(actor);

  return createCaller(actor);
};
