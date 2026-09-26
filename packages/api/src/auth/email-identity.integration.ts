import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

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

after(async () => {
  await db.$client.end();
});

const PASSWORD = "the-password-123";
const OTHER_PASSWORD = "a-different-password-456";

/** A unique address in the given casing, e.g. `Kai-<uuid>@Example.com`. */
const addressFor = (name: string) => `${name}-${randomUUID()}@Example.com`;

/** Seeds accounts with each address stored exactly as given and a working
    password: what every earlier deploy's sign-up left behind. */
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

/** The only lookup a deploy rolled back past this code has: exact match. */
const idsAnExactLookupFinds = async (address: string) => {
  const rows = await db.select({ id: user.id }).from(user).where(eq(user.email, address));
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

integrationTest(
  "a sign-up keeps its casing, so a rolled-back exact lookup still finds it",
  async () => {
    const typed = addressFor("MiXeD");
    const outcome = await runWithoutCookieScope(() =>
      createCaller(null).auth.signUp({ email: ` ${typed} `, password: PASSWORD }),
    );
    assert.equal(outcome, "reached-cookie-write");

    const [userId, ...others] = await idsHoldingAddress(typed);
    assert.ok(userId);
    assert.deepEqual(others, []);
    try {
      assert.equal(await storedEmail(userId), typed);
      assert.deepEqual(await idsAnExactLookupFinds(typed), [userId]);

      assert.equal(await signIn(typed), "reached-cookie-write");
      assert.equal(await signIn(typed.toLowerCase()), "reached-cookie-write");
      assert.equal(await signIn(typed.toUpperCase()), "reached-cookie-write");
      await assert.rejects(signIn(typed.toLowerCase(), OTHER_PASSWORD), INVALID_CREDENTIALS);
    } finally {
      await db.delete(user).where(eq(user.id, userId));
    }
  },
);

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

integrationTest("updateUser keeps the casing typed and refuses another's address", async () => {
  const mine = addressFor("Mine");
  const theirs = addressFor("Theirs");
  const fixture = await seedAccounts([{ email: mine }, { email: theirs }]);
  const [myId] = fixture.ids;
  assert.ok(myId);
  try {
    const me = await callerFor(myId);

    await assert.rejects(me.user.updateUser({ email: theirs.toLowerCase() }), CONFLICT);
    assert.equal(await storedEmail(myId), mine);

    const recased = mine.toUpperCase();
    const { user: updated } = await me.user.updateUser({ email: ` ${recased} ` });
    assert.equal(updated?.email, recased, "re-casing your own address is allowed");
    assert.deepEqual(await idsAnExactLookupFinds(recased), [myId]);
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
  "case-insensitive sign-in and reset leave every existing session alone",
  async () => {
    const legacy = addressFor("Signed-In");
    const fixture = await seedAccounts([{ email: legacy }]);
    const [userId] = fixture.ids;
    assert.ok(userId);
    try {
      const current = signSession(encodeSessionPayload(userId, NOW_SECONDS, 0), SESSION_KEY);
      // What pre-revocation `setSession` minted, still live in browsers and the
      // Expo app's SecureStore: no `epoch` at all.
      const epochless = signSession(
        Buffer.from(JSON.stringify({ iat: NOW_SECONDS, user: userId })).toString("base64"),
        SESSION_KEY,
      );
      const before = await workspaceOf(userId);

      assert.equal(await signIn(legacy.toLowerCase()), "reached-cookie-write");
      await assert.rejects(signIn(legacy.toUpperCase(), OTHER_PASSWORD), INVALID_CREDENTIALS);
      assert.deepEqual(await requestReset(legacy.toUpperCase()), [legacy]);

      assert.equal(await authenticatedId(current), userId);
      assert.equal(await authenticatedId(epochless), userId);
      const sessionUser = await findDbUser(userId);
      assert.equal(sessionUser?.sessionEpoch, 0, "no session was revoked");
      assert.deepEqual(await workspaceOf(userId), before);
    } finally {
      await fixture.cleanup();
    }
  },
);
