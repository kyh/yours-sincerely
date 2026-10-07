import assert from "node:assert/strict";
import test from "node:test";

import { expoPushToken, registerPushTokenInput, unregisterPushTokenInput } from "./push-schema.ts";

test("expoPushToken accepts both token families Expo has issued", () => {
  assert.equal(expoPushToken.safeParse("ExponentPushToken[abc-DEF_123]").success, true);
  assert.equal(expoPushToken.safeParse("ExpoPushToken[abc]").success, true);
});

test("expoPushToken rejects anything that is not a bracketed Expo token", () => {
  for (const junk of [
    "",
    "junk",
    "ExponentPushToken[]",
    "ExponentPushToken[a b]",
    "ExponentPushToken[abc",
    "apns:0123456789abcdef",
    " ExponentPushToken[abc]",
    "ExponentPushToken[abc]\n",
  ]) {
    assert.equal(expoPushToken.safeParse(junk).success, false, junk);
  }
});

test("registerPushTokenInput binds a token to a known platform", () => {
  assert.equal(
    registerPushTokenInput.safeParse({ platform: "ios", token: "ExponentPushToken[abc]" }).success,
    true,
  );
  assert.equal(
    registerPushTokenInput.safeParse({ platform: "web", token: "ExponentPushToken[abc]" }).success,
    false,
  );
  assert.equal(registerPushTokenInput.safeParse({ platform: "ios", token: "junk" }).success, false);
});

test("unregisterPushTokenInput needs a capability and a real token", () => {
  assert.equal(
    unregisterPushTokenInput.safeParse({ capability: "signed", token: "ExponentPushToken[abc]" })
      .success,
    true,
  );
  assert.equal(
    unregisterPushTokenInput.safeParse({ capability: "", token: "ExponentPushToken[abc]" }).success,
    false,
  );
  assert.equal(
    unregisterPushTokenInput.safeParse({ capability: "signed", token: "junk" }).success,
    false,
  );
});
