import assert from "node:assert/strict";
import test from "node:test";

import {
  getExpiryProgress,
  getLegacyAvatarIndex,
  getReadingTime,
  parseServerDate,
  POST_EXPIRY_DAYS,
  serverTimestamp,
} from "./content.ts";

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

test("reading time counts spaced words", () => {
  assert.deepEqual(getReadingTime("hello world"), {
    minutes: 0.01,
    text: "1 min read",
    words: 2,
  });
});

test("reading time counts each CJK character as a word", () => {
  assert.deepEqual(getReadingTime("日本語"), { minutes: 0.015, text: "1 min read", words: 3 });
});

test("reading time mixes CJK and spaced words", () => {
  assert.deepEqual(getReadingTime("hello 日本語 world"), {
    minutes: 0.025,
    text: "1 min read",
    words: 5,
  });
});

test("empty and whitespace-only text read as zero", () => {
  assert.deepEqual(getReadingTime(""), { minutes: 0, text: "0 min read", words: 0 });
  assert.deepEqual(getReadingTime("   "), { minutes: 0, text: "0 min read", words: 0 });
});

test("reading time is words / 200 minutes, rounded up for display", () => {
  assert.deepEqual(getReadingTime("word ".repeat(200)), {
    minutes: 1,
    text: "1 min read",
    words: 200,
  });
  assert.equal(getReadingTime("word ".repeat(201)).text, "2 min read");
});

test("zone-less server timestamps are parsed as UTC, not local", () => {
  assert.equal(
    parseServerDate("2026-07-09 18:23:45.123").toISOString(),
    "2026-07-09T18:23:45.123Z",
  );
});

test("explicit zones are respected, not double-shifted", () => {
  assert.equal(
    parseServerDate("2026-07-09T18:23:45.123Z").toISOString(),
    "2026-07-09T18:23:45.123Z",
  );
  assert.equal(
    parseServerDate("2026-07-09T18:23:45.123+09:00").toISOString(),
    "2026-07-09T09:23:45.123Z",
  );
});

test("date-only strings parse as UTC midnight", () => {
  assert.equal(parseServerDate("2026-07-09").toISOString(), "2026-07-09T00:00:00.000Z");
});

test("serverTimestamp accepts every shape Postgres prints for a timestamp(3)", () => {
  for (const value of [
    "2026-07-09 18:23:45.123",
    "2026-07-09 18:23:45.12",
    "2026-07-09 18:23:45.4",
    "2026-07-09 18:23:45",
    "2024-02-29 00:00:00",
    "2026-07-09T18:23:45.123",
    "2026-07-09T18:23:45.123Z",
    "2026-07-09T18:23:45.123+09:00",
    "2026-07-09T18:23:45-15:59",
    "2026-07-09 18:23:45.123+00",
  ]) {
    assert.equal(serverTimestamp.safeParse(value).success, true, value);
  }
});

test("serverTimestamp rejects what Postgres would fail to cast", () => {
  for (const value of [
    "",
    "garbage",
    "2026-07-09",
    "2026-07-09 18:23",
    "2026-13-01 00:00:00",
    "2026-02-30 00:00:00",
    "2025-02-29 00:00:00",
    "2026-04-31 00:00:00",
    "2026-07-09 25:00:00",
    "2026-07-09 18:60:00",
    "2026-07-09 18:23:45.123; drop table",
    "1 day ago",
    "0000-01-01 00:00:00",
    "2026-07-09 18:23:45+16:00",
    "2026-07-09 18:23:45+99:99",
  ]) {
    assert.equal(serverTimestamp.safeParse(value).success, false, value);
  }
});

test("a fresh letter is at 0% and not expired", () => {
  const now = new Date("2026-07-09T18:23:45.123Z");
  const progress = getExpiryProgress("2026-07-09 18:23:45.123", now);
  assert.equal(progress.percentage, 0);
  assert.equal(progress.isExpired, false);
  assert.equal(progress.start.toISOString(), "2026-07-09T18:23:45.123Z");
  assert.equal(progress.end.toISOString(), "2026-07-30T18:23:45.123Z");
});

test("the expiry window is exactly POST_EXPIRY_DAYS long", () => {
  const progress = getExpiryProgress("2026-07-09 00:00:00.000", new Date("2026-07-09T00:00:00Z"));
  const days = (progress.end.getTime() - progress.start.getTime()) / 86_400_000;
  assert.equal(days, POST_EXPIRY_DAYS);
});

test("halfway through the window reads 50%", () => {
  const start = Date.UTC(2026, 6, 9);
  const now = new Date(start + (POST_EXPIRY_DAYS / 2) * 86_400_000);
  assert.equal(getExpiryProgress("2026-07-09 00:00:00.000", now).percentage, 50);
});

test("percentage is clamped and expiry is flagged past the window", () => {
  const now = new Date("2026-08-30T00:00:00.000Z");
  const progress = getExpiryProgress("2026-07-09 18:23:45.123", now);
  assert.equal(progress.percentage, 100);
  assert.equal(progress.isExpired, true);
});

test("percentage is clamped at 0 for a future-dated letter", () => {
  const now = new Date("2026-07-01T00:00:00.000Z");
  const progress = getExpiryProgress("2026-07-09 00:00:00.000", now);
  assert.equal(progress.percentage, 0);
  assert.equal(progress.isExpired, false);
});

test("expiry is exclusive at the exact boundary instant", () => {
  const progress = getExpiryProgress("2026-07-09 00:00:00.000", new Date("2026-07-30T00:00:00Z"));
  assert.equal(progress.isExpired, true);
  assert.equal(progress.percentage, 100);
});
