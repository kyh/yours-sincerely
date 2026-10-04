import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { protectedBase, publicBase } from "@repo/contract/base";
import { db } from "@repo/db/drizzle-client";
import { createRouterClient, implement } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { z } from "zod";

import type { ORPCContext } from "../orpc";
import { requireUser } from "../orpc";
import { appRouter } from "../root-router";

/** A signed-in caller as `createORPCContext` resolves one. No call below reaches
    the database: middleware or input validation settles every one first. */
const viewer: NonNullable<ORPCContext["user"]> = {
  disabled: null,
  displayImage: null,
  displayName: "Tester",
  email: null,
  id: "user-1",
  role: "USER",
  sessionEpoch: 0,
};

const testContract = {
  protectedQuery: protectedBase.input(z.object({ postId: z.string().min(1) })).output(z.string()),
  publicQuery: publicBase.output(z.boolean()),
};

const os = implement(testContract).$context<ORPCContext>();
const authed = os.use(requireUser);

const testRouter = os.router({
  protectedQuery: authed.protectedQuery.handler(({ context }) => context.user.id),
  publicQuery: os.publicQuery.handler(({ context }) => context.user !== null),
});

describe("procedure authorization", () => {
  test("allows public access and passes signed-in callers through", async () => {
    const caller = createRouterClient(testRouter, { context: { db, user: viewer } });
    assert.equal(await caller.publicQuery(), true);
    assert.equal(await caller.protectedQuery({ postId: "post-1" }), "user-1");

    const anonymous = createRouterClient(testRouter, { context: { db, user: null } });
    assert.equal(await anonymous.publicQuery(), false);
    await assert.rejects(anonymous.protectedQuery({ postId: "post-1" }), {
      code: "UNAUTHORIZED",
    });
  });

  test("rejects unauthenticated callers before validating input", async () => {
    const anonymous = createRouterClient(testRouter, { context: { db, user: null } });
    await assert.rejects(anonymous.protectedQuery({ postId: "" }), { code: "UNAUTHORIZED" });
  });

  test("validates a signed-in caller's input", async () => {
    const caller = createRouterClient(testRouter, { context: { db, user: viewer } });
    await assert.rejects(caller.protectedQuery({ postId: "" }), { code: "BAD_REQUEST" });
  });
});

// Over the wire, because a malformed input is exactly what the typed in-process
// client cannot send. `requireUser` placed on the procedure instead of the
// implementer runs after input validation, and these answer 400.
const protectedPaths = [
  "auth/signOut",
  "auth/signOutEverywhere",
  "block/deleteBlock",
  "block/listBlocks",
  "like/deleteLike",
  "notification/list",
  "notification/markRead",
  "notification/unreadCount",
  "post/deletePost",
  "push/register",
  "user/deleteUser",
  "user/updateUser",
];

/** The protected procedures that take input. The rest would run their handler
    for a signed-in caller, and the handlers need a database. */
const protectedPathsWithInput = [
  "block/deleteBlock",
  "like/deleteLike",
  "notification/list",
  "notification/markRead",
  "post/deletePost",
  "push/register",
  "user/updateUser",
];

const callWithMalformedInput = async (path: string, user: ORPCContext["user"]) => {
  const { response } = await new RPCHandler(appRouter).handle(
    new Request(`http://localhost/api/orpc/${path}`, {
      body: JSON.stringify({ json: { cursor: 1, ids: 1, postId: 1, token: 1 } }),
      headers: { "content-type": "application/json" },
      method: "POST",
    }),
    { context: { db, user }, prefix: "/api/orpc" },
  );

  return response?.status;
};

describe("the app router", () => {
  test("an anonymous call is refused before its input is judged", async () => {
    for (const path of protectedPaths) {
      assert.equal(await callWithMalformedInput(path, null), 401, path);
    }
  });

  test("a signed-in caller's malformed input is still judged", async () => {
    for (const path of protectedPathsWithInput) {
      assert.equal(await callWithMalformedInput(path, viewer), 400, path);
    }
  });
});
