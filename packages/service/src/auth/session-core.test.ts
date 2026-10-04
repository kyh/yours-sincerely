import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod";

import {
  decideRenewal,
  encodeSessionPayload,
  parseLegacySecrets,
  parseSessionPayload,
  resolveSessionUser,
  signSession,
  unsignSession,
} from "./session-core.ts";

const ACTIVE_SECRET = "active-secret-active-secret-0001";
const LEGACY_SECRET = "legacy-secret-legacy-secret-0002";
const UNKNOWN_SECRET = "unknown-secret-unknown-secret-03";
const VERIFY_SECRETS = [ACTIVE_SECRET, LEGACY_SECRET];

const RENEW_AFTER_SECONDS = 60 * 60 * 24 * 7;
const NOW = 1_800_000_000;

/** Real crypto — exactly what `setSession` writes. */
const signCookie = (userId: string, issuedAtSeconds: number, secret: string, epoch = 0) =>
  signSession(encodeSessionPayload(userId, issuedAtSeconds, epoch), secret);

/** The pre-sliding-renewal payload shape: `{user}` with no `iat`. In the wild. */
const signLegacyPayloadCookie = (userId: string, secret: string) =>
  signSession(Buffer.from(JSON.stringify({ user: userId })).toString("base64"), secret);

const flipLastByte = (value: string) => `${value.slice(0, -1)}${value.endsWith("a") ? "b" : "a"}`;

const jsonValue = z.json();

const base64 = (value: z.infer<typeof jsonValue>) =>
  Buffer.from(JSON.stringify(value)).toString("base64");

const decide = (sessionValue: string | null | undefined, nowSeconds = NOW) =>
  decideRenewal({
    activeSecret: ACTIVE_SECRET,
    nowSeconds,
    renewAfterSeconds: RENEW_AFTER_SECONDS,
    sessionValue,
    verifySecrets: VERIFY_SECRETS,
  });

describe("unsignSession", () => {
  it("verifies a cookie signed with the active secret", () => {
    const cookie = signCookie("user-1", NOW, ACTIVE_SECRET);
    assert.equal(unsignSession(cookie, VERIFY_SECRETS), encodeSessionPayload("user-1", NOW, 0));
  });

  it("verifies a cookie signed with a legacy secret — the rotation promise", () => {
    const cookie = signCookie("user-1", NOW, LEGACY_SECRET);
    assert.equal(unsignSession(cookie, VERIFY_SECRETS), encodeSessionPayload("user-1", NOW, 0));
  });

  it("rejects a tampered cookie", () => {
    const cookie = signCookie("user-1", NOW, ACTIVE_SECRET);
    assert.equal(unsignSession(flipLastByte(cookie), VERIFY_SECRETS), null);
  });

  it("rejects a cookie signed with an unknown secret", () => {
    const cookie = signCookie("user-1", NOW, UNKNOWN_SECRET);
    assert.equal(unsignSession(cookie, VERIFY_SECRETS), null);
  });

  it("rejects everything when the verify list is empty", () => {
    const cookie = signCookie("user-1", NOW, ACTIVE_SECRET);
    assert.equal(unsignSession(cookie, []), null);
  });
});

describe("parseLegacySecrets", () => {
  it("handles the shapes COOKIE_SECRET_LEGACY actually takes", () => {
    // oxlint-disable-next-line unicorn/no-useless-undefined -- an unset env var is the case under test
    assert.deepEqual(parseLegacySecrets(undefined), []);
    assert.deepEqual(parseLegacySecrets(""), []);
    assert.deepEqual(parseLegacySecrets("one"), ["one"]);
    assert.deepEqual(parseLegacySecrets("one,two,three"), ["one", "two", "three"]);
    assert.deepEqual(parseLegacySecrets("  one , two  "), ["one", "two"]);
    assert.deepEqual(parseLegacySecrets("one,,two,"), ["one", "two"]);
    assert.deepEqual(parseLegacySecrets(",  ,"), []);
  });
});

describe("parseSessionPayload", () => {
  it("parses a current payload", () => {
    assert.deepEqual(parseSessionPayload(encodeSessionPayload("user-1", NOW, 3)), {
      epoch: 3,
      iat: NOW,
      user: "user-1",
    });
  });

  it("parses a legacy payload with no `iat` — these are in the wild", () => {
    const legacy = Buffer.from(JSON.stringify({ user: "user-1" })).toString("base64");
    assert.deepEqual(parseSessionPayload(legacy), { epoch: 0, iat: null, user: "user-1" });
  });

  it("ignores a non-numeric `iat` rather than rejecting the session", () => {
    const payload = Buffer.from(JSON.stringify({ iat: "nope", user: "user-1" })).toString("base64");
    assert.deepEqual(parseSessionPayload(payload), { epoch: 0, iat: null, user: "user-1" });
  });

  it("rejects attacker-supplied garbage", () => {
    assert.equal(parseSessionPayload("!!!not-base64!!!"), null);
    assert.equal(parseSessionPayload(Buffer.from("not json").toString("base64")), null);
    assert.equal(parseSessionPayload(base64("a string")), null);
    assert.equal(parseSessionPayload(base64(42)), null);
    assert.equal(parseSessionPayload(base64(null)), null);
    assert.equal(parseSessionPayload(base64({})), null);
    assert.equal(parseSessionPayload(base64({ iat: NOW })), null);
    assert.equal(parseSessionPayload(base64({ user: 1 })), null);
    assert.equal(parseSessionPayload(base64({ user: null })), null);
    assert.equal(parseSessionPayload(base64({ user: { id: "user-1" } })), null);
    assert.equal(parseSessionPayload(base64(["user-1"])), null);
    assert.equal(parseSessionPayload(""), null);
  });
});

describe("decideRenewal", () => {
  it("reports no session when the cookie is absent", () => {
    // oxlint-disable-next-line unicorn/no-useless-undefined -- an absent cookie is the case under test
    assert.deepEqual(decide(undefined), { decision: "no-session", payload: null });
    assert.deepEqual(decide(null), { decision: "no-session", payload: null });
    assert.deepEqual(decide(""), { decision: "no-session", payload: null });
  });

  it("reports invalid for an unverifiable cookie", () => {
    assert.deepEqual(decide("garbage"), { decision: "invalid", payload: null });
    assert.deepEqual(decide(signCookie("user-1", NOW, UNKNOWN_SECRET)), {
      decision: "invalid",
      payload: null,
    });
  });

  it("reports invalid for a correctly signed but unparseable payload", () => {
    const signedGarbage = signSession(Buffer.from("not json").toString("base64"), ACTIVE_SECRET);
    assert.deepEqual(decide(signedGarbage), { decision: "invalid", payload: null });
  });

  it("leaves a fresh cookie signed by the active secret alone", () => {
    const result = decide(signCookie("user-1", NOW - 60, ACTIVE_SECRET));
    assert.equal(result.decision, "fresh");
    assert.deepEqual(result.payload, { epoch: 0, iat: NOW - 60, user: "user-1" });
  });

  it("renews a stale cookie signed by the active secret", () => {
    const result = decide(signCookie("user-1", NOW - RENEW_AFTER_SECONDS - 1, ACTIVE_SECRET));
    assert.equal(result.decision, "renew");
    assert.deepEqual(result.payload, {
      epoch: 0,
      iat: NOW - RENEW_AFTER_SECONDS - 1,
      user: "user-1",
    });
  });

  it("renews a FRESH cookie that is still signed by a legacy secret", () => {
    // The whole ballgame for secret rotation: if this ever returns "fresh",
    // sessions never migrate onto the active signer and emptying
    // COOKIE_SECRET_LEGACY would log out the entire user base.
    const result = decide(signCookie("user-1", NOW - 60, LEGACY_SECRET));
    assert.equal(result.decision, "renew");
    assert.deepEqual(result.payload, { epoch: 0, iat: NOW - 60, user: "user-1" });
  });

  it("renews a legacy payload with no `iat` (age computes from epoch 0)", () => {
    const result = decide(signLegacyPayloadCookie("user-1", ACTIVE_SECRET));
    assert.equal(result.decision, "renew");
    assert.deepEqual(result.payload, { epoch: 0, iat: null, user: "user-1" });
  });

  it("renews at exactly renewAfterSeconds old (the boundary is inclusive of renewal)", () => {
    const atBoundary = decide(signCookie("user-1", NOW - RENEW_AFTER_SECONDS, ACTIVE_SECRET));
    assert.equal(atBoundary.decision, "renew");

    const justInside = decide(signCookie("user-1", NOW - RENEW_AFTER_SECONDS + 1, ACTIVE_SECRET));
    assert.equal(justInside.decision, "fresh");
  });

  it("treats a future-dated cookie as fresh (negative age)", () => {
    const result = decide(signCookie("user-1", NOW + 10_000, ACTIVE_SECRET));
    assert.equal(result.decision, "fresh");
  });

  it("never consults the clock for anything but staleness — sessions do not expire", () => {
    // A cookie issued 10 years ago is stale, so it RENEWS. It is never rejected.
    // If this ever returns "invalid", someone added an expiry.
    const ancient = decide(signCookie("user-1", NOW - 60 * 60 * 24 * 365 * 10, ACTIVE_SECRET));
    assert.equal(ancient.decision, "renew");
    assert.deepEqual(ancient.payload?.user, "user-1");
  });
});

/** An in-memory stand-in for the `User` table lookup the request context does. */
const createUserStore = (users: Record<string, number>) => {
  let lookups = 0;
  return {
    findUser: (userId: string) => {
      lookups += 1;
      const sessionEpoch = users[userId];
      return Promise.resolve(sessionEpoch === undefined ? null : { id: userId, sessionEpoch });
    },
    get lookups() {
      return lookups;
    },
  };
};

describe("resolveSessionUser", () => {
  it("authenticates a cookie whose epoch matches the user's", async () => {
    const store = createUserStore({ "user-1": 4 });
    const cookie = signCookie("user-1", NOW, ACTIVE_SECRET, 4);

    const user = await resolveSessionUser({
      findUser: store.findUser,
      sessionValue: cookie,
      verifySecrets: VERIFY_SECRETS,
    });

    assert.deepEqual(user, { id: "user-1", sessionEpoch: 4 });
    // Exactly the query the context already makes.
    assert.equal(store.lookups, 1);
  });

  it("THE MASS-LOGOUT GUARD: a cookie with NO `epoch` field still authenticates", async () => {
    // This is the cookie in every browser and every SecureStore today. It has no
    // `epoch`. It MUST read as 0 and match the column default. If this test ever
    // fails, shipping logs out the entire user base.
    const store = createUserStore({ "user-1": 0 });
    const noEpochCookie = signSession(
      Buffer.from(JSON.stringify({ iat: NOW, user: "user-1" })).toString("base64"),
      ACTIVE_SECRET,
    );
    assert.equal(noEpochCookie.includes("epoch"), false);

    const user = await resolveSessionUser({
      findUser: store.findUser,
      sessionValue: noEpochCookie,
      verifySecrets: VERIFY_SECRETS,
    });

    assert.deepEqual(user, { id: "user-1", sessionEpoch: 0 });
  });

  it("also authenticates the oldest shape of all: no `iat` AND no `epoch`", async () => {
    const store = createUserStore({ "user-1": 0 });

    const user = await resolveSessionUser({
      findUser: store.findUser,
      sessionValue: signLegacyPayloadCookie("user-1", LEGACY_SECRET),
      verifySecrets: VERIFY_SECRETS,
    });

    assert.deepEqual(user, { id: "user-1", sessionEpoch: 0 });
  });

  it("REVOCATION: rejects a cookie whose epoch is behind the user's", async () => {
    // The epoch was bumped; `captured` is an attacker's copy from before.
    const store = createUserStore({ "user-1": 1 });
    const captured = signCookie("user-1", NOW, ACTIVE_SECRET, 0);

    assert.equal(
      await resolveSessionUser({
        findUser: store.findUser,
        sessionValue: captured,
        verifySecrets: VERIFY_SECRETS,
      }),
      null,
    );
  });

  it("rejects a forged epoch ahead of the user's", async () => {
    const store = createUserStore({ "user-1": 1 });

    assert.equal(
      await resolveSessionUser({
        findUser: store.findUser,
        sessionValue: signCookie("user-1", NOW, ACTIVE_SECRET, 99),
        verifySecrets: VERIFY_SECRETS,
      }),
      null,
    );
  });

  it("rejects an absent, unverifiable, or unknown-user session without querying", async () => {
    const store = createUserStore({ "user-1": 0 });

    assert.equal(
      await resolveSessionUser({
        findUser: store.findUser,
        sessionValue: undefined,
        verifySecrets: VERIFY_SECRETS,
      }),
      null,
    );
    assert.equal(
      await resolveSessionUser({
        findUser: store.findUser,
        sessionValue: signCookie("user-1", NOW, UNKNOWN_SECRET),
        verifySecrets: VERIFY_SECRETS,
      }),
      null,
    );
    assert.equal(store.lookups, 0);

    assert.equal(
      await resolveSessionUser({
        findUser: store.findUser,
        sessionValue: signCookie("deleted-user", NOW, ACTIVE_SECRET),
        verifySecrets: VERIFY_SECRETS,
      }),
      null,
    );
  });

  it("REVOCATION SURVIVES RENEWAL: a stale revoked cookie is rejected, not renewed", async () => {
    // The trap. The cookie is stale, so `decideRenewal` says "renew" — it WOULD
    // be re-issued if anything asked. But the epoch gate rejects it first, and
    // the request context only renews AFTER that gate passes. So it never renews.
    const store = createUserStore({ "user-1": 1 });
    const staleRevoked = signCookie("user-1", NOW - RENEW_AFTER_SECONDS - 1, ACTIVE_SECRET, 0);

    // Renewable in principle, but never authenticated, so renewal is unreachable.
    assert.equal(decide(staleRevoked).decision, "renew");
    assert.equal(
      await resolveSessionUser({
        findUser: store.findUser,
        sessionValue: staleRevoked,
        verifySecrets: VERIFY_SECRETS,
      }),
      null,
    );
  });
});
