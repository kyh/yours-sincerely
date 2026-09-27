import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { eq } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { user } from "@repo/db/drizzle-schema";
import { compare } from "bcryptjs";

import { callerFor, createCaller, runWithoutCookieScope } from "../test-utils";
import { createUserIfNotExists } from "./auth-utils";

const integrationTest = process.env.RUN_DB_TESTS === "1" ? test : test.skip;

after(async () => {
  await db.$client.end();
});

/** Mints an anonymous user exactly as a cookieless first write does. The mint
    returns its id only after the cookie write, so the row is found by a
    display name no other row carries. */
const mintAnonymousUser = async () => {
  const displayName = `anon-${randomUUID()}`;
  assert.equal(
    await runWithoutCookieScope(() => createUserIfNotExists({ db, user: null }, displayName)),
    "reached-cookie-write",
  );

  const minted = await db.query.user.findFirst({
    columns: { email: true, id: true, passwordHash: true },
    where: { displayName },
  });
  assert.ok(minted);

  return { ...minted, cleanup: () => db.delete(user).where(eq(user.id, minted.id)) };
};

/** The one answer sign-in gives for every failure, so it reveals nothing. */
const INVALID_CREDENTIALS = { code: "UNAUTHORIZED", message: "Invalid email or password" };

integrationTest("an anonymous user is minted without a password hash", async () => {
  const anonymous = await mintAnonymousUser();
  try {
    assert.equal(anonymous.email, null);
    assert.equal(anonymous.passwordHash, null);
  } finally {
    await anonymous.cleanup();
  }
});

integrationTest(
  "an anonymous user with an email but no password fails sign-in like an unknown email",
  async () => {
    const anonymous = await mintAnonymousUser();
    try {
      const email = `${anonymous.id}@example.com`;
      await db.update(user).set({ email }).where(eq(user.id, anonymous.id));

      const guest = createCaller(null);
      await assert.rejects(
        guest.auth.signInWithPassword({ email, password: "any-password-123" }),
        INVALID_CREDENTIALS,
      );
      await assert.rejects(
        guest.auth.signInWithPassword({
          email: `${randomUUID()}@example.com`,
          password: "any-password-123",
        }),
        INVALID_CREDENTIALS,
      );
    } finally {
      await anonymous.cleanup();
    }
  },
);

integrationTest("an anonymous user can still claim the account through signUp", async () => {
  const anonymous = await mintAnonymousUser();
  try {
    const email = `${anonymous.id}@example.com`;
    const caller = await callerFor(anonymous.id);

    assert.equal(
      await runWithoutCookieScope(() =>
        caller.auth.signUp({ email, password: "a-real-password-123" }),
      ),
      "reached-cookie-write",
    );

    const claimed = await db.query.user.findFirst({
      columns: { email: true, passwordHash: true },
      where: { id: anonymous.id },
    });
    assert.equal(claimed?.email, email);
    assert.ok(claimed?.passwordHash);
    assert.ok(await compare("a-real-password-123", claimed.passwordHash));
  } finally {
    await anonymous.cleanup();
  }
});

integrationTest("auth.workspace hands the client its viewer fields and nothing else", async () => {
  const anonymous = await mintAnonymousUser();
  try {
    const caller = await callerFor(anonymous.id);
    const { user: viewer } = await caller.auth.workspace();

    assert.ok(viewer);
    assert.deepEqual(Object.keys(viewer).toSorted(), [
      "disabled",
      "displayImage",
      "displayName",
      "email",
      "id",
    ]);
    assert.equal(viewer.id, anonymous.id);
  } finally {
    await anonymous.cleanup();
  }
});
