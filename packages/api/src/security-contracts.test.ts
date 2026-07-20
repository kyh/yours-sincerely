import assert from "node:assert/strict";
import test from "node:test";

import { createPostInput } from "./post/post-schema.ts";
import { requestPasswordResetInput } from "./auth/auth-schema.ts";
import { updateUserInput } from "./user/user-schema.ts";

test("the retired userId field is stripped, not rejected and not honored", () => {
  // Shipped Expo binaries still send it. Accepting the payload keeps them
  // working; stripping the key is what stops it naming another account.
  const parsed = updateUserInput.parse({
    userId: "another-user",
    displayName: "New name",
  });

  assert.deepEqual(parsed, { displayName: "New name" });
});

test("profile updates require a mutable field", () => {
  assert.equal(updateUserInput.safeParse({ userId: "another-user" }).success, false);
});

test("post creation cannot set the server-owned base like count", () => {
  const parsed = createPostInput.parse({
    content: "A complete little love letter",
    baseLikeCount: 1_000_000,
  });

  assert.deepEqual(parsed, { content: "A complete little love letter" });
});

test("password reset accepts no client-controlled redirect target", () => {
  assert.deepEqual(
    requestPasswordResetInput.parse({
      email: "hello@example.com",
      target: "https://attacker.example",
    }),
    { email: "hello@example.com" },
  );
});
