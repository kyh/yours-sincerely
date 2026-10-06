import assert from "node:assert/strict";
import test from "node:test";

import {
  describeNotification,
  listNotificationsInput,
  markNotificationsReadInput,
  newCommentNotificationData,
  notificationTargetData,
} from "./notification-schema.ts";

test("newCommentNotificationData requires both post ids", () => {
  assert.equal(
    newCommentNotificationData.safeParse({ commentPostId: "c1", parentPostId: "p1" }).success,
    true,
  );
  assert.equal(newCommentNotificationData.safeParse({ parentPostId: "p1" }).success, false);
  assert.equal(
    newCommentNotificationData.safeParse({ commentPostId: "c1", parentPostId: "" }).success,
    false,
  );
});

test("notificationTargetData needs only the parent letter", () => {
  assert.deepEqual(
    notificationTargetData.parse({ commentPostId: "c1", extra: 1, parentPostId: "p1" }),
    { parentPostId: "p1" },
  );
  assert.deepEqual(notificationTargetData.parse({ parentPostId: "p1" }), { parentPostId: "p1" });
});

test("notificationTargetData rejects payloads a client cannot route", () => {
  for (const payload of [undefined, null, {}, { parentPostId: "" }, { parentPostId: 42 }, "p1"]) {
    assert.equal(notificationTargetData.safeParse(payload).success, false);
  }
});

test("markNotificationsReadInput is either everything or a bounded list of ids", () => {
  assert.deepEqual(markNotificationsReadInput.parse({ scope: "all" }), { scope: "all" });
  assert.deepEqual(markNotificationsReadInput.parse({ ids: ["n1", "n2"], scope: "ids" }), {
    ids: ["n1", "n2"],
    scope: "ids",
  });
  for (const payload of [
    { ids: [], scope: "ids" },
    { scope: "ids" },
    { ids: [""], scope: "ids" },
    { ids: Array.from({ length: 101 }, (_, index) => `n${index}`), scope: "ids" },
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
  assert.equal(
    listNotificationsInput.safeParse({
      cursor: { createdAt: "2026-01-01 00:00:00.5", notificationId: "n1" },
    }).success,
    true,
  );
});

test("listNotificationsInput rejects a cursor timestamp Postgres cannot cast", () => {
  assert.equal(
    listNotificationsInput.safeParse({ cursor: { createdAt: "yesterday", notificationId: "n1" } })
      .success,
    false,
  );
});

test("describeNotification is the one sentence both the row and the push use", () => {
  assert.equal(
    describeNotification({ actorName: "Kai", kind: "COMMENT" }),
    "Kai replied to your letter",
  );
  assert.equal(
    describeNotification({ actorName: "Anonymous", kind: "COMMENT" }),
    "Anonymous replied to your letter",
  );
});
