import assert from "node:assert/strict";
import test from "node:test";

import { getLegacyAvatarIndex } from "./user-display.ts";

test("legacy avatar mapping is stable — DO NOT change these expected values", () => {
  assert.equal(getLegacyAvatarIndex("Anonymous"), 7);
  assert.equal(getLegacyAvatarIndex(""), 0);
  assert.equal(getLegacyAvatarIndex("a"), 17);
  assert.equal(getLegacyAvatarIndex("A"), 5);
  assert.equal(getLegacyAvatarIndex("z"), 2);
  assert.equal(getLegacyAvatarIndex("日本語"), 3);
  assert.equal(getLegacyAvatarIndex("Kaiyu"), 15);
  assert.equal(getLegacyAvatarIndex("kaiyu"), 7);
  assert.equal(getLegacyAvatarIndex("user-1234"), 12);
  assert.equal(getLegacyAvatarIndex("🙂"), 5);
  assert.equal(getLegacyAvatarIndex("The quick brown fox"), 9);
  assert.equal(getLegacyAvatarIndex("x".repeat(500)), 4);
  assert.equal(getLegacyAvatarIndex("Long letter writer name that overflows"), 6);
  assert.equal(getLegacyAvatarIndex("\uFFFF".repeat(7)), 7);
  assert.equal(getLegacyAvatarIndex("Ünïcödé 💌 letters"), 13);
});

test("legacy avatar mapping defaults to Anonymous", () => {
  assert.equal(getLegacyAvatarIndex(), getLegacyAvatarIndex("Anonymous"));
});

test("avatar index is always within range", () => {
  for (const value of ["", "a", "Anonymous", "日本語", "🙂", "x".repeat(500)]) {
    const index = getLegacyAvatarIndex(value);
    assert.ok(index >= 0 && index < 20, `${value} → ${index} out of range`);
  }
});
