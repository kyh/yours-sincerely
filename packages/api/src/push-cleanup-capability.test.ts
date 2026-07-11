import assert from "node:assert/strict";
import test from "node:test";

import {
  parsePushCleanupCapability,
  signPushCleanupCapability,
} from "./auth/push-cleanup-capability.ts";

const SECRET = "test-secret";

test("push cleanup capability preserves its owner", () => {
  const capability = signPushCleanupCapability("user-1", SECRET);
  assert.equal(parsePushCleanupCapability(capability, [SECRET]), "user-1");
});

test("push cleanup capability rejects tampering", () => {
  const capability = signPushCleanupCapability("user-1", SECRET);
  const replacement = capability.endsWith("a") ? "b" : "a";
  const tampered = `${capability.slice(0, -1)}${replacement}`;
  assert.equal(parsePushCleanupCapability(tampered, [SECRET]), null);
});
