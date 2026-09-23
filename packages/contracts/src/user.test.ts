import assert from "node:assert/strict";
import test from "node:test";

import { getLegacyAvatarIndex } from "./content.ts";
import { MAX_DISPLAY_NAME_LENGTH } from "./post.ts";
import { ANONYMOUS_DISPLAY_NAME, resolveDisplayName, updateUserInput } from "./user.ts";

test("a missing or blank display name resolves to Anonymous", () => {
  for (const name of [undefined, null, ""]) {
    assert.equal(resolveDisplayName(name), ANONYMOUS_DISPLAY_NAME);
  }
});

test("a real display name is kept verbatim, because it seeds the avatar", () => {
  assert.equal(resolveDisplayName("Bob"), "Bob");
  assert.equal(resolveDisplayName(" Bob "), " Bob ");
});

test("a blank name gets the same avatar as Anonymous", () => {
  assert.equal(getLegacyAvatarIndex(resolveDisplayName("")), getLegacyAvatarIndex());
});

test("updateUserInput caps a display name at MAX_DISPLAY_NAME_LENGTH", () => {
  const atCap = "x".repeat(MAX_DISPLAY_NAME_LENGTH);
  assert.equal(updateUserInput.safeParse({ displayName: atCap }).success, true);
  assert.equal(updateUserInput.safeParse({ displayName: `${atCap}x` }).success, false);
});

test("updateUserInput rejects a display name that trims to nothing", () => {
  assert.equal(updateUserInput.safeParse({ displayName: "   " }).success, false);
});
