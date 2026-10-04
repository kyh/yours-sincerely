import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { eq } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { token as tokenTable, user } from "@repo/db/drizzle-schema";
import { compare } from "bcryptjs";

import { createCaller, runWithoutCookieScope } from "../test-utils";
import { issuePasswordReset } from "./password-reset";
import type { ResetEmail } from "./password-reset-core";
import { hashResetToken } from "./password-reset-core";

const integrationTest = process.env.RUN_DB_TESTS === "1" ? test : test.skip;

after(async () => {
  await db.$client.end();
});

const HOUR_MS = 60 * 60 * 1000;
const APP_URL = "https://yourssincerely.org";
const NEW_PASSWORD = "a-new-password-123";

const createFixture = async () => {
  const userId = randomUUID();
  const email = `${userId}@example.com`;
  await db.insert(user).values({ displayName: "Resetter", email, id: userId });

  const cleanup = async () => {
    await db.delete(tokenTable).where(eq(tokenTable.userId, userId));
    await db.delete(user).where(eq(user.id, userId));
  };

  return { cleanup, email, userId };
};

/** A link issued earlier and still outstanding, stored the way issuing stores it. */
const seedResetToken = async (
  userId: string,
  {
    createdAt,
    expiresAt = new Date(Date.now() + HOUR_MS).toISOString(),
    stored = hashResetToken,
  }: {
    createdAt?: string;
    expiresAt?: string;
    stored?: (resetToken: string) => string;
  } = {},
) => {
  const resetToken = randomUUID();
  await db.insert(tokenTable).values({
    createdAt,
    expiresAt,
    id: randomUUID(),
    sentTo: `${userId}@example.com`,
    token: stored(resetToken),
    type: "RESET_PASSWORD",
    updatedAt: new Date().toISOString(),
    userId,
  });
  return resetToken;
};

const tokenRows = (userId: string) =>
  db
    .select({ token: tokenTable.token, usedAt: tokenTable.usedAt })
    .from(tokenTable)
    .where(eq(tokenTable.userId, userId));

const usedAtOf = async (userId: string, resetToken: string) => {
  const rows = await tokenRows(userId);
  const row = rows.find((candidate) => candidate.token === hashResetToken(resetToken));
  assert.ok(row, "the link is stored by its digest");
  return row.usedAt;
};

const readUser = async (userId: string) => {
  const found = await db.query.user.findFirst({
    columns: { passwordHash: true, sessionEpoch: true },
    where: { id: userId },
  });
  assert.ok(found);
  return found;
};

const redeem = (resetToken: string) =>
  runWithoutCookieScope(() =>
    createCaller(null).auth.setPassword({ password: NEW_PASSWORD, token: resetToken }),
  );

/** Delivers nothing; hands back the link the user would have clicked. */
const capturingSender = () => {
  const delivered: ResetEmail[] = [];
  const send = (email: ResetEmail) => {
    delivered.push(email);
    return Promise.resolve();
  };
  const tokenFromLink = () => {
    const [email] = delivered;
    assert.ok(email, "the link was sent");
    const resetToken = new URL(email.resetUrl).searchParams.get("token");
    assert.ok(resetToken);
    return resetToken;
  };
  return { delivered, send, tokenFromLink };
};

integrationTest("a delivered link is stored only as its digest and redeems once", async () => {
  const fixture = await createFixture();
  try {
    const sender = capturingSender();
    await issuePasswordReset(db, {
      appUrl: APP_URL,
      email: fixture.email,
      send: sender.send,
      userId: fixture.userId,
    });

    assert.equal(sender.delivered[0]?.to, fixture.email);
    const resetToken = sender.tokenFromLink();
    const [stored] = await tokenRows(fixture.userId);
    assert.ok(stored);
    assert.notEqual(stored.token, resetToken, "a read of the Token table must not yield a link");
    assert.equal(stored.token, hashResetToken(resetToken));

    assert.equal(await redeem(resetToken), "reached-cookie-write");
    const reset = await readUser(fixture.userId);
    assert.ok(reset.passwordHash);
    assert.ok(await compare(NEW_PASSWORD, reset.passwordHash));
    assert.equal(reset.sessionEpoch, 1);

    await assert.rejects(redeem(resetToken), /Invalid or expired reset token/u);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("a failed send leaves no new link and the old ones working", async () => {
  const fixture = await createFixture();
  try {
    const outstanding = await seedResetToken(fixture.userId);

    await assert.rejects(
      issuePasswordReset(db, {
        appUrl: APP_URL,
        email: fixture.email,
        send: () => Promise.reject(new Error("Resend daily_quota_exceeded: quota reached")),
        userId: fixture.userId,
      }),
      /Resend daily_quota_exceeded/u,
    );

    const rows = await tokenRows(fixture.userId);
    assert.equal(rows.length, 1, "the undelivered link must not stay redeemable");
    assert.equal(await usedAtOf(fixture.userId, outstanding), null, "the old link was not burned");
    assert.equal(await redeem(outstanding), "reached-cookie-write");
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("a delivered link burns older links, but not a newer one", async () => {
  const fixture = await createFixture();
  try {
    const older = await seedResetToken(fixture.userId, {
      createdAt: new Date(Date.now() - 60_000).toISOString(),
    });
    // What a concurrent request issued after this one looks like by the time
    // this one burns.
    const newer = await seedResetToken(fixture.userId, {
      createdAt: new Date(Date.now() + 60_000).toISOString(),
    });

    const sender = capturingSender();
    await issuePasswordReset(db, {
      appUrl: APP_URL,
      email: fixture.email,
      send: sender.send,
      userId: fixture.userId,
    });

    assert.notEqual(await usedAtOf(fixture.userId, older), null);
    assert.equal(await usedAtOf(fixture.userId, newer), null);
    assert.equal(await usedAtOf(fixture.userId, sender.tokenFromLink()), null);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("two concurrent redemptions of one link: exactly one wins", async () => {
  const fixture = await createFixture();
  try {
    const resetToken = await seedResetToken(fixture.userId);

    const outcomes = await Promise.allSettled([redeem(resetToken), redeem(resetToken)]);

    assert.equal(outcomes.filter((outcome) => outcome.status === "fulfilled").length, 1);
    const rejected = outcomes.find((outcome) => outcome.status === "rejected");
    assert.ok(rejected);
    assert.match(String(rejected.reason), /Invalid or expired reset token/u);
    const { sessionEpoch } = await readUser(fixture.userId);
    assert.equal(sessionEpoch, 1, "revoked exactly once");
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("an expired link changes nothing", async () => {
  const fixture = await createFixture();
  try {
    const expired = await seedResetToken(fixture.userId, {
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });

    await assert.rejects(redeem(expired), /Invalid or expired reset token/u);

    const untouched = await readUser(fixture.userId);
    assert.equal(untouched.passwordHash, null);
    assert.equal(untouched.sessionEpoch, 0);
    assert.equal(await usedAtOf(fixture.userId, expired), null);
  } finally {
    await fixture.cleanup();
  }
});

// Redemption looks up the digest only. A raw-token fallback would make a read
// of the Token table a working link again.
integrationTest("a link stored in plaintext does not redeem", async () => {
  const fixture = await createFixture();
  try {
    const plaintext = await seedResetToken(fixture.userId, { stored: (resetToken) => resetToken });

    await assert.rejects(redeem(plaintext), /Invalid or expired reset token/u);
    const { passwordHash } = await readUser(fixture.userId);
    assert.equal(passwordHash, null);
  } finally {
    await fixture.cleanup();
  }
});
