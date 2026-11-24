import assert from "node:assert/strict";
import test from "node:test";

import { getExpiryProgress, getReadingTime, POST_EXPIRY_DAYS } from "./post-content.ts";

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
