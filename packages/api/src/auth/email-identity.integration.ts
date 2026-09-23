import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { after, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

import { eq, inArray, sql } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { token as tokenTable, user } from "@repo/db/drizzle-schema";
import { hash } from "bcryptjs";

import { callerFor, createCaller, runWithoutCookieScope } from "../test-utils";
import { sendPasswordReset } from "./password-reset";
import type { ResetEmail } from "./password-reset-core";
import { authenticateSessionValue } from "./session";
import {
  deriveKey,
  encodeSessionPayload,
  resolveCookieSecret,
  SESSION_PURPOSE,
  signSession,
} from "./session-core";
import { findSessionUser } from "./session-user";

const integrationTest = process.env.RUN_DB_TESTS === "1" ? test : test.skip;

const RECONCILE_SQL = path.join(import.meta.dirname, "../../../db/sql/080-reconcile.sql");

after(async () => {
  await db.$client.end();
});

const PASSWORD = "the-password-123";
const OTHER_PASSWORD = "a-different-password-456";

/** The whole file, as a push applies it: many statements, simple protocol. */
const runReconcile = async () => {
  await db.$client.unsafe(await readFile(RECONCILE_SQL, "utf-8")).simple();
};

/** A unique address in the given casing, e.g. `Kai-<uuid>@Example.com`. */
const addressFor = (name: string) => `${name}-${randomUUID()}@Example.com`;

/** Seeds accounts the way pre-normalization writes left them: the address
    exactly as typed, with a working password. */
const seedAccounts = async (accounts: readonly { email: string; password?: string }[]) => {
  const ids = accounts.map(() => randomUUID());
  await db.insert(user).values(
    await Promise.all(
      accounts.map(async ({ email, password = PASSWORD }, index) => ({
        displayName: "Legacy writer",
        email,
        id: ids[index],
        passwordHash: await hash(password, 10),
      })),
    ),
  );

  const cleanup = async () => {
    await db.delete(tokenTable).where(inArray(tokenTable.userId, ids));
    await db.delete(user).where(inArray(user.id, ids));
  };

  return { cleanup, ids };
};

const signIn = (email: string, password = PASSWORD) =>
  runWithoutCookieScope(() => createCaller(null).auth.signInWithPassword({ email, password }));

const INVALID_CREDENTIALS = { code: "UNAUTHORIZED", message: "Invalid email or password" };

const CONFLICT = { code: "CONFLICT" };

const storedEmail = async (userId: string) => {
  const row = await db.query.user.findFirst({ columns: { email: true }, where: { id: userId } });
  assert.ok(row);
  return row.email;
};

const idsHoldingAddress = async (address: string) => {
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(sql`lower(${user.email}) = lower(${address})`);
  return rows.map((row) => row.id);
};

/** Delivers nothing; records who each link went to. */
const capturingSender = () => {
  const delivered: ResetEmail[] = [];
  const send = (email: ResetEmail) => {
    delivered.push(email);
    return Promise.resolve();
  };
  return { delivered, send };
};

const requestReset = async (address: string) => {
  const sender = capturingSender();
  await sendPasswordReset(db, { address, appUrl: "https://yourssincerely.org", send: sender.send });
  return sender.delivered.map((email) => email.to);
};

const resetLinkOwners = async (userIds: string[]) => {
  const rows = await db
    .select({ userId: tokenTable.userId })
    .from(tokenTable)
    .where(inArray(tokenTable.userId, userIds));
  return rows.map((row) => row.userId);
};

integrationTest("a mixed-case sign-up is stored lowercase and signs in in any case", async () => {
  const typed = addressFor("MiXeD");
  const outcome = await runWithoutCookieScope(() =>
    createCaller(null).auth.signUp({ email: ` ${typed} `, password: PASSWORD }),
  );
  assert.equal(outcome, "reached-cookie-write");

  const [userId, ...others] = await idsHoldingAddress(typed);
  assert.ok(userId);
  assert.deepEqual(others, []);
  try {
    assert.equal(await storedEmail(userId), typed.toLowerCase());

    assert.equal(await signIn(typed.toLowerCase()), "reached-cookie-write");
    assert.equal(await signIn(typed.toUpperCase()), "reached-cookie-write");
    assert.equal(await signIn(typed), "reached-cookie-write");
    await assert.rejects(signIn(typed.toLowerCase(), OTHER_PASSWORD), INVALID_CREDENTIALS);
  } finally {
    await db.delete(user).where(eq(user.id, userId));
  }
});

integrationTest(
  "a legacy mixed-case account signs in with its own casing and any other",
  async () => {
    const legacy = addressFor("Legacy");
    const fixture = await seedAccounts([{ email: legacy }]);
    try {
      assert.equal(await signIn(legacy), "reached-cookie-write");
      assert.equal(await signIn(legacy.toLowerCase()), "reached-cookie-write");
      assert.equal(await signIn(legacy.toUpperCase()), "reached-cookie-write");
      await assert.rejects(signIn(legacy.toLowerCase(), OTHER_PASSWORD), INVALID_CREDENTIALS);

      const [userId] = fixture.ids;
      assert.ok(userId);
      assert.equal(await storedEmail(userId), legacy, "sign-in never rewrites the address");
    } finally {
      await fixture.cleanup();
    }
  },
);

integrationTest("accounts differing only in case each keep their own sign-in", async () => {
  const upper = addressFor("Kai");
  const lower = upper.toLowerCase();
  const fixture = await seedAccounts([
    { email: upper, password: PASSWORD },
    { email: lower, password: OTHER_PASSWORD },
  ]);
  try {
    assert.equal(await signIn(upper, PASSWORD), "reached-cookie-write");
    assert.equal(await signIn(lower, OTHER_PASSWORD), "reached-cookie-write");

    await assert.rejects(signIn(upper, OTHER_PASSWORD), INVALID_CREDENTIALS);
    await assert.rejects(signIn(lower, PASSWORD), INVALID_CREDENTIALS);

    // A third casing names both, so it resolves to neither.
    await assert.rejects(signIn(upper.toUpperCase(), PASSWORD), INVALID_CREDENTIALS);
    await assert.rejects(signIn(upper.toUpperCase(), OTHER_PASSWORD), INVALID_CREDENTIALS);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest(
  "a reset in any casing reaches the one account, at its stored address",
  async () => {
    const legacy = addressFor("Resetter");
    const fixture = await seedAccounts([{ email: legacy }]);
    try {
      assert.deepEqual(await requestReset(legacy.toLowerCase()), [legacy]);
      assert.deepEqual(await requestReset(legacy), [legacy]);
      assert.deepEqual(await resetLinkOwners(fixture.ids), [fixture.ids[0], fixture.ids[0]]);

      assert.deepEqual(await requestReset(addressFor("Nobody")), []);
    } finally {
      await fixture.cleanup();
    }
  },
);

integrationTest("a reset for one of two case-twins targets that account only", async () => {
  const upper = addressFor("Twin");
  const lower = upper.toLowerCase();
  const fixture = await seedAccounts([{ email: upper }, { email: lower }]);
  const [upperId, lowerId] = fixture.ids;
  assert.ok(upperId);
  assert.ok(lowerId);
  try {
    assert.deepEqual(await requestReset(upper), [upper]);
    assert.deepEqual(await resetLinkOwners(fixture.ids), [upperId]);

    assert.deepEqual(await requestReset(lower), [lower]);
    const bothOwners = await resetLinkOwners(fixture.ids);
    assert.deepEqual(bothOwners.toSorted(), [upperId, lowerId].toSorted());

    assert.deepEqual(await requestReset(upper.toUpperCase()), [], "ambiguous: send nothing");
    assert.deepEqual(await resetLinkOwners(fixture.ids), bothOwners);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("sign-up cannot create an account that differs from one only in case", async () => {
  const legacy = addressFor("Taken");
  const fixture = await seedAccounts([{ email: legacy }]);
  try {
    await assert.rejects(
      createCaller(null).auth.signUp({ email: legacy.toUpperCase(), password: PASSWORD }),
      CONFLICT,
    );
    assert.deepEqual(await idsHoldingAddress(legacy), fixture.ids);
  } finally {
    await fixture.cleanup();
  }
});

integrationTest("updateUser stores lowercase and refuses another account's address", async () => {
  const mine = addressFor("Mine");
  const theirs = addressFor("Theirs");
  const fixture = await seedAccounts([{ email: mine }, { email: theirs }]);
  const [myId] = fixture.ids;
  assert.ok(myId);
  try {
    const me = await callerFor(myId);

    await assert.rejects(me.user.updateUser({ email: theirs.toLowerCase() }), CONFLICT);
    assert.equal(await storedEmail(myId), mine);

    const { user: updated } = await me.user.updateUser({ email: mine.toUpperCase() });
    assert.equal(updated?.email, mine.toLowerCase(), "re-casing your own address is allowed");
  } finally {
    await fixture.cleanup();
  }
});

// The key `session.ts` signs with, derived from the same env through the same
// functions, so a cookie minted here is one the server would have issued.
const SESSION_KEY = deriveKey(resolveCookieSecret(process.env), SESSION_PURPOSE);
const NOW_SECONDS = Math.floor(Date.now() / 1000);

const findDbUser = (userId: string) => findSessionUser(db, userId);

const authenticatedId = async (sessionValue: string) => {
  const sessionUser = await authenticateSessionValue(sessionValue, findDbUser);
  return sessionUser?.id;
};

const workspaceOf = async (userId: string) => {
  const caller = await callerFor(userId);
  const { user: viewer } = await caller.auth.workspace();
  assert.ok(viewer);
  return viewer;
};

integrationTest(
  "signed-in users stay signed in, with the same workspace, across the backfill",
  async () => {
    const mixed = addressFor("Signed-In");
    const clean = addressFor("clean").toLowerCase();
    const fixture = await seedAccounts([{ email: mixed }, { email: clean }]);
    const [mixedId, cleanId] = fixture.ids;
    assert.ok(mixedId);
    assert.ok(cleanId);
    try {
      const cookies = [mixedId, cleanId].map((userId) => ({
        current: signSession(encodeSessionPayload(userId, NOW_SECONDS, 0), SESSION_KEY),
        // What pre-revocation `setSession` minted, still live in browsers and the
        // Expo app's SecureStore: no `epoch` at all.
        epochless: signSession(
          Buffer.from(JSON.stringify({ iat: NOW_SECONDS, user: userId })).toString("base64"),
          SESSION_KEY,
        ),
        userId,
      }));
      const before = { clean: await workspaceOf(cleanId), mixed: await workspaceOf(mixedId) };

      await runReconcile();

      for (const cookie of cookies) {
        assert.equal(await authenticatedId(cookie.current), cookie.userId);
        assert.equal(await authenticatedId(cookie.epochless), cookie.userId);
        const sessionUser = await findDbUser(cookie.userId);
        assert.equal(sessionUser?.sessionEpoch, 0, "no session was revoked");
      }
      assert.deepEqual(await workspaceOf(cleanId), before.clean);
      assert.deepEqual(await workspaceOf(mixedId), { ...before.mixed, email: mixed.toLowerCase() });

      assert.equal(await signIn(mixed), "reached-cookie-write", "the old casing still signs in");
    } finally {
      await fixture.cleanup();
    }
  },
);

integrationTest(
  "the backfill normalizes lone rows, skips case-twins, and re-runs clean",
  async () => {
    const lone = addressFor("Lone");
    const padded = addressFor("Padded");
    const twin = addressFor("Twin");
    const fixture = await seedAccounts([
      { email: lone },
      { email: ` ${padded} ` },
      { email: twin },
      { email: twin.toLowerCase() },
    ]);
    const [loneId, paddedId, twinId, twinLowerId] = fixture.ids;
    assert.ok(loneId);
    assert.ok(paddedId);
    assert.ok(twinId);
    assert.ok(twinLowerId);
    try {
      await runReconcile();

      assert.equal(await storedEmail(loneId), lone.toLowerCase());
      assert.equal(await storedEmail(paddedId), padded.toLowerCase());
      assert.equal(await storedEmail(twinId), twin, "a collision is left for a person to merge");
      assert.equal(await storedEmail(twinLowerId), twin.toLowerCase());

      await runReconcile();
      assert.equal(await storedEmail(loneId), lone.toLowerCase());
      assert.equal(await storedEmail(twinId), twin);

      assert.equal(await signIn(padded), "reached-cookie-write");
      assert.equal(await signIn(twin), "reached-cookie-write");
    } finally {
      await fixture.cleanup();
    }
  },
);

/** Resolves once some backend in this database is blocked on a lock. */
const waitForLockWait = async () => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const [row] = await db.execute<{ waiting: number }>(
      sql`SELECT count(*)::int AS waiting FROM pg_stat_activity
          WHERE datname = current_database() AND wait_event_type = 'Lock'`,
    );
    if ((row?.waiting ?? 0) > 0) {
      return;
    }
    await delay(50);
  }
  assert.fail("the backfill never blocked on the racing sign-up");
};

integrationTest("a sign-up racing the backfill cannot fail the push", async () => {
  const racer = addressFor("Racer");
  const fixture = await seedAccounts([{ email: racer }]);
  const [racerId] = fixture.ids;
  assert.ok(racerId);
  const lateId = randomUUID();
  try {
    // Holds the lowercase address uncommitted until the backfill has read the
    // table and is blocked on it: exactly the window its collision skip misses.
    const lateSignUp = await db.$client.reserve();
    try {
      await lateSignUp`BEGIN`;
      await lateSignUp`INSERT INTO public."User" (id, email, "displayName")
                       VALUES (${lateId}, ${racer.toLowerCase()}, 'Late')`;
      const reconcile = runReconcile();
      await waitForLockWait();
      await lateSignUp`COMMIT`;
      await reconcile;
    } finally {
      lateSignUp.release();
    }

    assert.equal(await storedEmail(racerId), racer, "the raced row is left as it was");
  } finally {
    await db.delete(user).where(eq(user.id, lateId));
    await fixture.cleanup();
  }
});
