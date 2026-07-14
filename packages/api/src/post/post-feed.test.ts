import assert from "node:assert/strict";
import test from "node:test";

import { getFeedInput } from "./post-schema.ts";

test("feed limit is bounded", () => {
  assert.equal(getFeedInput.safeParse({ limit: 1_000_000 }).success, false);
  assert.equal(getFeedInput.safeParse({ limit: 0 }).success, false);
  assert.equal(getFeedInput.safeParse({ limit: 2.5 }).success, false);
  assert.equal(getFeedInput.safeParse({ limit: -1 }).success, false);
  assert.equal(getFeedInput.safeParse({ limit: 1 }).success, true);
  assert.equal(getFeedInput.safeParse({ limit: 50 }).success, true);
  assert.equal(getFeedInput.safeParse({ limit: 51 }).success, false);
  assert.equal(getFeedInput.safeParse({}).success, true);
});

test("feed input no longer accepts a parentId filter", () => {
  // The Feed view only contains root posts, so the filter could never match.
  assert.deepEqual(getFeedInput.parse({ parentId: "some-post-id" }), {});
});

test("feed input still accepts the filters clients actually send", () => {
  assert.deepEqual(getFeedInput.parse({ userId: "a-user", limit: 5 }), {
    userId: "a-user",
    limit: 5,
  });
  assert.deepEqual(
    getFeedInput.parse({ cursor: { createdAt: "2026-07-12T00:00:00.000", postId: "a-post" } }),
    { cursor: { createdAt: "2026-07-12T00:00:00.000", postId: "a-post" } },
  );
});
