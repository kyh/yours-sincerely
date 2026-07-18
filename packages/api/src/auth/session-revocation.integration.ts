import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { eq, inArray } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { token as tokenTable, user } from "@repo/db/drizzle-schema";

import { appRouter } from "../root-router";
import { authenticateSessionValue } from "./session";
import {
  deriveKey,
  encodeSessionPayload,
  resolveCookieSecret,
  SESSION_PURPOSE,
  signSession,
} from "./session-core";

const integrationTest = process.env.RUN_DB_TESTS === "1" ? test : test.skip;

after(async () => {
  await db.$client.end();
});

// The key `session.ts` signs with — derived from the SAME env, through the SAME
// pure functions. If `session.ts` ever wires its keys differently, the cookies
// minted here stop verifying and every test below fails loudly.
const SESSION_KEY = deriveKey(resolveCookieSecret(process.env), SESSION_PURPOSE);

const NOW_SECONDS = Math.floor(Date.now() / 1000);
const SESSION_RENEW_AFTER_SECONDS = 60 * 60 * 24 * 7;

/** A cookie exactly as the CURRENT `setSession` mints it. */
const mintSessionCookie = (userId: string, sessionEpoch: number, iat = NOW_SECONDS) =>
  signSession(encodeSessionPayload(userId, iat, sessionEpoch), SESSION_KEY);

/**
 * A cookie as the PRE-REVOCATION `setSession` minted it: `{user, iat}` with no
 * `epoch` field at all. This is what is sitting in browsers and in the Expo
 * app's SecureStore right now.
 */
const mintLegacyCookieWithoutEpoch = (userId: string, iat = NOW_SECONDS) =>
  signSession(Buffer.from(JSON.stringify({ user: userId, iat })).toString("base64"), SESSION_KEY);

/** The lookup `createTRPCContext` performs — same columns, same exclusions. */
const findDbUser = async (userId: string) => {
  const found = await db.query.user.findFirst({
    where: (row, { eq: equals }) => equals(row.id, userId),
    columns: { passwordHash: false },
  });
  return found ?? null;
};

/** Does this cookie authenticate against the real database? */
const authenticates = async (sessionValue: string) =>
  (await authenticateSessionValue(sessionValue, findDbUser)) !== null;

const readSessionEpoch = async (userId: string) => {
  const row = await findDbUser(userId);
  assert.ok(row);
  return row.sessionEpoch;
};

/**
 * The routers write the session cookie via `next/headers`, which throws outside
 * a Next request scope. Every database effect runs BEFORE that write, so the
 * mutation is driven for real and only that one specific error is absorbed.
 * Anything else rethrows.
 */
const runWithoutCookieScope = async (operation: () => Promise<unknown>) => {
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

const createFixture = async () => {
  const userId = randomUUID();
  await db.insert(user).values({ id: userId, displayName: "Session Owner" });

  const actor = await findDbUser(userId);
  assert.ok(actor);

  const cleanup = async () => {
    await db.delete(tokenTable).where(eq(tokenTable.userId, userId));
    await db.delete(user).where(inArray(user.id, [userId]));
  };

  return {
    userId,
    caller: appRouter.createCaller({ headers: new Headers(), user: actor, db }),
    cleanup,
  };
};

const createResetToken = async (userId: string) => {
  const tokenValue = randomUUID();
  await db.insert(tokenTable).values({
    id: randomUUID(),
    token: tokenValue,
    type: "RESET_PASSWORD",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    sentTo: `${userId}@example.com`,
    userId,
    updatedAt: new Date().toISOString(),
  });
  return tokenValue;
};

integrationTest(
  "THE MASS-LOGOUT GUARD: a cookie with no `epoch` field still authenticates",
  async () => {
    const fixture = await createFixture();
    try {
      const inTheWild = mintLegacyCookieWithoutEpoch(fixture.userId);

      // Prove the payload really has no epoch — otherwise this tests nothing.
      const [payload] = inTheWild.split(".");
      assert.equal(
        JSON.stringify(JSON.parse(Buffer.from(payload ?? "", "base64").toString("utf8"))).includes(
          "epoch",
        ),
        false,
      );
      assert.equal(await readSessionEpoch(fixture.userId), 0);

      assert.equal(
        await authenticates(inTheWild),
        true,
        "a pre-revocation cookie MUST still authenticate — failing this logs out every user in production",
      );
    } finally {
      await fixture.cleanup();
    }
  },
);

integrationTest("a password reset revokes sessions captured beforehand", async () => {
  const fixture = await createFixture();
  try {
    const captured = mintSessionCookie(fixture.userId, 0);
    const legacyCaptured = mintLegacyCookieWithoutEpoch(fixture.userId);
    assert.equal(await authenticates(captured), true);
    assert.equal(await authenticates(legacyCaptured), true);

    const resetToken = await createResetToken(fixture.userId);
    await runWithoutCookieScope(() =>
      fixture.caller.auth.setPassword({ token: resetToken, password: "a-new-password-123" }),
    );

    assert.equal(await readSessionEpoch(fixture.userId), 1);
    assert.equal(
      await authenticates(captured),
      false,
      "the attacker's captured cookie must be evicted by the reset",
    );
    assert.equal(
      await authenticates(legacyCaptured),
      false,
      "an epoch-less cookie is revoked too — it reads as epoch 0, which is now stale",
    );
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("the person who reset the password stays signed in", async () => {
  const fixture = await createFixture();
  try {
    const resetToken = await createResetToken(fixture.userId);
    await runWithoutCookieScope(() =>
      fixture.caller.auth.setPassword({ token: resetToken, password: "a-new-password-123" }),
    );

    // The cookie `setPassword` issues carries the epoch it just bumped to.
    const issuedByTheReset = mintSessionCookie(
      fixture.userId,
      await readSessionEpoch(fixture.userId),
    );

    assert.equal(await authenticates(issuedByTheReset), true);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("sliding renewal cannot resurrect a revoked session", async () => {
  const fixture = await createFixture();
  try {
    // Stale enough that `renewSessionIfStale` would re-issue it...
    const staleCookie = mintSessionCookie(
      fixture.userId,
      0,
      NOW_SECONDS - SESSION_RENEW_AFTER_SECONDS - 1,
    );
    assert.equal(await authenticates(staleCookie), true);

    await runWithoutCookieScope(() => fixture.caller.auth.signOutEverywhere());
    assert.equal(await readSessionEpoch(fixture.userId), 1);

    // ...but the epoch gate runs BEFORE renewal in `createTRPCContext`, so the
    // request is rejected and the cookie is never re-signed.
    assert.equal(
      await authenticates(staleCookie),
      false,
      "a revoked session must not renew itself back into validity",
    );

    // And a cookie re-signed with the epoch from the OLD cookie (the bug this
    // guards against) would still be rejected.
    assert.equal(await authenticates(mintSessionCookie(fixture.userId, 0)), false);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("signOutEverywhere invalidates a cookie captured beforehand", async () => {
  const fixture = await createFixture();
  try {
    const captured = mintSessionCookie(fixture.userId, 0);
    assert.equal(await authenticates(captured), true);

    await runWithoutCookieScope(() => fixture.caller.auth.signOutEverywhere());

    assert.equal(await authenticates(captured), false);
    // The user can sign in again and the fresh cookie works.
    assert.equal(
      await authenticates(
        mintSessionCookie(fixture.userId, await readSessionEpoch(fixture.userId)),
      ),
      true,
    );
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("issuing a new reset link burns the outstanding ones", async () => {
  const fixture = await createFixture();
  try {
    const firstToken = await createResetToken(fixture.userId);
    const secondToken = await createResetToken(fixture.userId);

    // Consuming one burns every other unused RESET_PASSWORD token for this user.
    await runWithoutCookieScope(() =>
      fixture.caller.auth.setPassword({ token: secondToken, password: "a-new-password-123" }),
    );

    const rows = await db
      .select({ token: tokenTable.token, usedAt: tokenTable.usedAt })
      .from(tokenTable)
      .where(eq(tokenTable.userId, fixture.userId));
    const used = new Map(rows.map((row) => [row.token, row.usedAt]));

    assert.notEqual(used.get(firstToken), null);
    assert.notEqual(used.get(secondToken), null);

    // ...and the burned one can no longer be redeemed.
    await assert.rejects(
      fixture.caller.auth.setPassword({ token: firstToken, password: "another-password-123" }),
      /Invalid or expired reset token/,
    );
  } finally {
    await fixture.cleanup();
  }
});
