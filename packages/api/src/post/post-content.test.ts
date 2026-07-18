import assert from "node:assert/strict";
import test from "node:test";

import { createPostInput, MAX_POST_LENGTH } from "@repo/contracts/post";
import { updateUserInput } from "../user/user-schema.ts";

test("post content is bounded at both ends", () => {
  assert.equal(createPostInput.safeParse({ content: "x".repeat(10) }).success, true);
  assert.equal(createPostInput.safeParse({ content: "short" }).success, false);
  assert.equal(createPostInput.safeParse({ content: "x".repeat(MAX_POST_LENGTH) }).success, true);
  assert.equal(
    createPostInput.safeParse({ content: "x".repeat(MAX_POST_LENGTH + 1) }).success,
    false,
  );
  assert.equal(createPostInput.safeParse({ content: "x".repeat(100_000) }).success, false);
});

test("post content is trimmed, and whitespace does not buy length", () => {
  assert.deepEqual(createPostInput.parse({ content: "  a valid letter  " }), {
    content: "a valid letter",
  });
  assert.equal(createPostInput.safeParse({ content: `short${" ".repeat(50)}` }).success, false);
});

test("createdBy obeys the same 50-char rule as displayName", () => {
  const fifty = "x".repeat(50);
  assert.equal(
    createPostInput.safeParse({ content: "a valid letter", createdBy: fifty }).success,
    true,
  );
  assert.equal(
    createPostInput.safeParse({ content: "a valid letter", createdBy: "x".repeat(51) }).success,
    false,
  );

  // One column (User.displayName), one rule — `createdBy` becomes the anonymous
  // author's display name, so the two contracts must agree.
  assert.equal(updateUserInput.safeParse({ userId: "u", displayName: fifty }).success, true);
  assert.equal(
    updateUserInput.safeParse({ userId: "u", displayName: "x".repeat(51) }).success,
    false,
  );
});
