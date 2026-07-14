import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  parsePushCleanupCapability,
  PUSH_CLEANUP_TTL_SECONDS,
  signPushCleanupCapability,
} from "./push-cleanup-capability.ts";
import {
  buildVerifySecrets,
  DEV_SIGNING_SECRET,
  deriveKey,
  encodeSessionPayload,
  isLocalEnv,
  parseLegacySecrets,
  parseSessionPayload,
  PUSH_CLEANUP_PURPOSE,
  resolveCookieSecret,
  SESSION_PURPOSE,
  signSession,
  unsignSession,
} from "./session-core.ts";

const REAL_SECRET = "a-real-secret-of-at-least-32-chars";
const OLD_SECRET = "the-previous-secret-32-chars-long!";
const NOW = 1_800_000_000;

/** Exactly how `session.ts` builds its keys — same functions, same order. */
const sessionVerifySecrets = (activeSecret: string, legacySecrets: readonly string[] = []) =>
  buildVerifySecrets({ activeSecret, legacySecrets, purpose: SESSION_PURPOSE });

const pushCleanupVerifySecrets = (activeSecret: string, legacySecrets: readonly string[] = []) =>
  buildVerifySecrets({ activeSecret, legacySecrets, purpose: PUSH_CLEANUP_PURPOSE });

describe("resolveCookieSecret", () => {
  it("fails closed when COOKIE_SECRET is missing outside development/test", () => {
    for (const NODE_ENV of [undefined, "", "production", "preview", "staging", "Production"]) {
      assert.throws(
        () => resolveCookieSecret({ NODE_ENV }),
        /COOKIE_SECRET must be set/,
        `NODE_ENV=${String(NODE_ENV)} must not silently use the public dev constant`,
      );
    }
  });

  it("allows the dev fallback only in development and test", () => {
    assert.equal(resolveCookieSecret({ NODE_ENV: "development" }), DEV_SIGNING_SECRET);
    assert.equal(resolveCookieSecret({ NODE_ENV: "test" }), DEV_SIGNING_SECRET);
    assert.equal(
      resolveCookieSecret({ NODE_ENV: "development", COOKIE_SECRET: "" }),
      DEV_SIGNING_SECRET,
    );
    assert.equal(isLocalEnv("production"), false);
    assert.equal(isLocalEnv(undefined), false);
  });

  it("rejects a secret with too little entropy", () => {
    assert.throws(
      () => resolveCookieSecret({ NODE_ENV: "production", COOKIE_SECRET: "x" }),
      /at least 32 characters/,
    );
    assert.throws(
      () =>
        resolveCookieSecret({
          NODE_ENV: "development",
          COOKIE_SECRET: "31-chars-is-one-short-of-enough",
        }),
      /at least 32 characters/,
    );
  });

  it("accepts a configured secret of sufficient length in any environment", () => {
    assert.equal(
      resolveCookieSecret({ NODE_ENV: "production", COOKIE_SECRET: REAL_SECRET }),
      REAL_SECRET,
    );
    assert.equal(resolveCookieSecret({ COOKIE_SECRET: REAL_SECRET }), REAL_SECRET);
  });
});

describe("deriveKey", () => {
  it("produces a stable, purpose-scoped key", () => {
    assert.equal(deriveKey(REAL_SECRET, SESSION_PURPOSE), deriveKey(REAL_SECRET, SESSION_PURPOSE));
    assert.notEqual(
      deriveKey(REAL_SECRET, SESSION_PURPOSE),
      deriveKey(REAL_SECRET, PUSH_CLEANUP_PURPOSE),
    );
    assert.notEqual(
      deriveKey(REAL_SECRET, SESSION_PURPOSE),
      deriveKey(OLD_SECRET, SESSION_PURPOSE),
    );
    assert.notEqual(deriveKey(REAL_SECRET, SESSION_PURPOSE), REAL_SECRET);
  });
});

describe("the mass-logout guard", () => {
  it("still verifies a session cookie signed with the RAW secret after key derivation", () => {
    // This is the cookie sitting in browsers and in the Expo app's SecureStore
    // right now. If it stops verifying, every user is logged out.
    const inTheWild = signSession(encodeSessionPayload("user-1", NOW, 0), REAL_SECRET);

    const unsigned = unsignSession(inTheWild, sessionVerifySecrets(REAL_SECRET));
    assert.notEqual(unsigned, null);
    assert.deepEqual(parseSessionPayload(unsigned ?? ""), { user: "user-1", iat: NOW, epoch: 0 });
  });

  it("still verifies a session cookie signed with a raw LEGACY secret", () => {
    const rotatedOut = signSession(encodeSessionPayload("user-1", NOW, 0), OLD_SECRET);
    const verify = sessionVerifySecrets(REAL_SECRET, [OLD_SECRET]);

    assert.notEqual(unsignSession(rotatedOut, verify), null);
  });

  it("verifies a cookie signed with a DERIVED legacy key — rotation after this change", () => {
    // Once the fleet is on derived keys, a later rotation moves the old ROOT
    // secret into COOKIE_SECRET_LEGACY. Cookies out there are signed with
    // derive(oldRoot), so the derived legacy key must be in the verify list too.
    const derivedLegacy = signSession(
      encodeSessionPayload("user-1", NOW, 0),
      deriveKey(OLD_SECRET, SESSION_PURPOSE),
    );

    assert.notEqual(
      unsignSession(derivedLegacy, sessionVerifySecrets(REAL_SECRET, [OLD_SECRET])),
      null,
    );
  });

  it("verifies a cookie signed with the new derived active key", () => {
    const fresh = signSession(
      encodeSessionPayload("user-1", NOW, 0),
      deriveKey(REAL_SECRET, SESSION_PURPOSE),
    );

    assert.notEqual(unsignSession(fresh, sessionVerifySecrets(REAL_SECRET)), null);
  });

  it("rejects a cookie signed with a secret that was never configured", () => {
    const forged = signSession(
      encodeSessionPayload("user-1", NOW, 0),
      "attacker-secret-32-chars-long!!!",
    );
    assert.equal(unsignSession(forged, sessionVerifySecrets(REAL_SECRET, [OLD_SECRET])), null);
  });

  it("keeps the verify list ordered: derived active key first", () => {
    assert.deepEqual(sessionVerifySecrets(REAL_SECRET, [OLD_SECRET]), [
      deriveKey(REAL_SECRET, SESSION_PURPOSE),
      REAL_SECRET,
      deriveKey(OLD_SECRET, SESSION_PURPOSE),
      OLD_SECRET,
    ]);
    assert.deepEqual(parseLegacySecrets(`${OLD_SECRET}, `), [OLD_SECRET]);
  });
});

describe("key separation", () => {
  it("does not accept a push-cleanup capability as a session", () => {
    const capability = signPushCleanupCapability(
      "user-1",
      deriveKey(REAL_SECRET, PUSH_CLEANUP_PURPOSE),
      NOW,
    );

    const unsigned = unsignSession(capability, sessionVerifySecrets(REAL_SECRET));
    assert.equal(unsigned, null);
  });

  it("does not accept a session cookie as a push-cleanup capability", () => {
    const session = signSession(
      encodeSessionPayload("user-1", NOW, 0),
      deriveKey(REAL_SECRET, SESSION_PURPOSE),
    );

    assert.equal(parsePushCleanupCapability(session, pushCleanupVerifySecrets(REAL_SECRET)), null);
  });

  it("rejects cross-purpose tokens even while the raw secret is still trusted", () => {
    // During the migration window the RAW secret verifies in BOTH lists, so the
    // payload shape is the only thing standing between the two. It must hold.
    const rawSignedCapability = signPushCleanupCapability("user-1", REAL_SECRET, NOW);
    const rawSignedSession = signSession(encodeSessionPayload("user-1", NOW, 0), REAL_SECRET);

    const unsignedCapability = unsignSession(
      rawSignedCapability,
      sessionVerifySecrets(REAL_SECRET),
    );
    assert.notEqual(unsignedCapability, null); // the signature does verify...
    assert.equal(parseSessionPayload(unsignedCapability ?? ""), null); // ...but it is not a session

    assert.equal(
      parsePushCleanupCapability(rawSignedSession, pushCleanupVerifySecrets(REAL_SECRET)),
      null,
    );
  });
});

describe("push-cleanup capability expiry", () => {
  const verify = pushCleanupVerifySecrets(REAL_SECRET);
  const key = deriveKey(REAL_SECRET, PUSH_CLEANUP_PURPOSE);

  it("accepts a capability within its TTL", () => {
    const capability = signPushCleanupCapability("user-1", key, NOW);
    assert.equal(parsePushCleanupCapability(capability, verify, NOW), "user-1");
    assert.equal(
      parsePushCleanupCapability(capability, verify, NOW + PUSH_CLEANUP_TTL_SECONDS - 1),
      "user-1",
    );
  });

  it("rejects an expired capability", () => {
    const capability = signPushCleanupCapability("user-1", key, NOW);
    assert.equal(
      parsePushCleanupCapability(capability, verify, NOW + PUSH_CLEANUP_TTL_SECONDS),
      null,
    );
    assert.equal(
      parsePushCleanupCapability(capability, verify, NOW + PUSH_CLEANUP_TTL_SECONDS + 1),
      null,
    );
  });

  it("still accepts an `exp`-less capability — the Expo SecureStore migration window", () => {
    // The Expo app holds one of these to clean up its push device AFTER sign-out,
    // the one moment it cannot re-mint. Rejecting these strands those devices.
    const legacyCapability = signSession(
      Buffer.from(JSON.stringify({ scope: "push-cleanup", userId: "user-1" })).toString(
        "base64url",
      ),
      REAL_SECRET,
    );

    assert.equal(parsePushCleanupCapability(legacyCapability, verify, NOW), "user-1");
  });

  it("rejects tampering and unknown signers", () => {
    const capability = signPushCleanupCapability("user-1", key, NOW);
    const tampered = `${capability.slice(0, -1)}${capability.endsWith("a") ? "b" : "a"}`;

    assert.equal(parsePushCleanupCapability(tampered, verify, NOW), null);
    assert.equal(
      parsePushCleanupCapability(
        signPushCleanupCapability("user-1", "some-other-key-32-chars-long!!!!", NOW),
        verify,
        NOW,
      ),
      null,
    );
  });

  it("keeps trying later secrets when an earlier one yields a malformed payload", () => {
    // The loop-abort nit: a `catch` that returned null aborted verification
    // against the remaining (legacy) secrets.
    const legacyKey = deriveKey(OLD_SECRET, PUSH_CLEANUP_PURPOSE);
    const capability = signPushCleanupCapability("user-1", legacyKey, NOW);

    assert.equal(
      parsePushCleanupCapability(
        capability,
        pushCleanupVerifySecrets(REAL_SECRET, [OLD_SECRET]),
        NOW,
      ),
      "user-1",
    );
  });
});
