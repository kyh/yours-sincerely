import assert from "node:assert/strict";
import test from "node:test";

import {
  describeNotification,
  expoPushToken,
  listNotificationsInput,
  markNotificationsReadInput,
  newCommentNotificationData,
  notificationTargetData,
  registerPushTokenInput,
  unregisterPushTokenInput,
} from "./notifications.ts";

test("newCommentNotificationData requires both post ids", () => {
  assert.equal(
    newCommentNotificationData.safeParse({ parentPostId: "p1", commentPostId: "c1" }).success,
    true,
  );
  assert.equal(newCommentNotificationData.safeParse({ parentPostId: "p1" }).success, false);
  assert.equal(
    newCommentNotificationData.safeParse({ parentPostId: "", commentPostId: "c1" }).success,
    false,
  );
});

test("notificationTargetData needs only the parent letter", () => {
  assert.deepEqual(
    notificationTargetData.parse({ parentPostId: "p1", commentPostId: "c1", extra: 1 }),
    { parentPostId: "p1" },
  );
  assert.deepEqual(notificationTargetData.parse({ parentPostId: "p1" }), { parentPostId: "p1" });
});

test("notificationTargetData rejects payloads a client cannot route", () => {
  for (const payload of [undefined, null, {}, { parentPostId: "" }, { parentPostId: 42 }, "p1"]) {
    assert.equal(notificationTargetData.safeParse(payload).success, false);
  }
});

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
    registerPushTokenInput.safeParse({ token: "ExponentPushToken[abc]", platform: "ios" }).success,
    true,
  );
  assert.equal(
    registerPushTokenInput.safeParse({ token: "ExponentPushToken[abc]", platform: "web" }).success,
    false,
  );
  assert.equal(registerPushTokenInput.safeParse({ token: "junk", platform: "ios" }).success, false);
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

test("markNotificationsReadInput is either everything or a bounded list of ids", () => {
  assert.deepEqual(markNotificationsReadInput.parse({ scope: "all" }), { scope: "all" });
  assert.deepEqual(markNotificationsReadInput.parse({ scope: "ids", ids: ["n1", "n2"] }), {
    scope: "ids",
    ids: ["n1", "n2"],
  });
  for (const payload of [
    { scope: "ids", ids: [] },
    { scope: "ids" },
    { scope: "ids", ids: [""] },
    { scope: "ids", ids: Array.from({ length: 101 }, (_, index) => `n${index}`) },
    { scope: "some" },
    {},
  ]) {
    assert.equal(markNotificationsReadInput.safeParse(payload).success, false);
  }
});

test("listNotificationsInput bounds the page and needs a whole cursor", () => {
  assert.deepEqual(listNotificationsInput.parse({}), {});
  assert.equal(listNotificationsInput.safeParse({ limit: 50 }).success, true);
  assert.equal(listNotificationsInput.safeParse({ limit: 0 }).success, false);
  assert.equal(listNotificationsInput.safeParse({ limit: 51 }).success, false);
  assert.equal(
    listNotificationsInput.safeParse({ cursor: { createdAt: "2026-01-01T00:00:00.000Z" } }).success,
    false,
  );
  assert.equal(
    listNotificationsInput.safeParse({
      cursor: { createdAt: "2026-01-01T00:00:00.000Z", notificationId: "n1" },
    }).success,
    true,
  );
});

test("describeNotification is the one sentence both the row and the push use", () => {
  assert.equal(
    describeNotification({ kind: "COMMENT", actorName: "Kai" }),
    "Kai replied to your letter",
  );
  assert.equal(
    describeNotification({ kind: "COMMENT", actorName: "Anonymous" }),
    "Anonymous replied to your letter",
  );
});
