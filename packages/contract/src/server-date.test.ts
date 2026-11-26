import assert from "node:assert/strict";
import test from "node:test";

import { parseServerDate, serverTimestamp } from "./server-date.ts";

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
