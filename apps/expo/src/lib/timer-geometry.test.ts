import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sectorPath } from "./timer-geometry.ts";

const RADIUS = 8;

/** Arc endpoint from the path's `A … x y Z` tail. */
const endpoint = (path: string) => {
  const match = /A [\d.]+ [\d.]+ 0 (?<largeArc>\d) 1 (?<x>-?[\d.e-]+) (?<y>-?[\d.e-]+) Z$/u.exec(
    path,
  );
  assert.ok(match?.groups, `unexpected path: ${path}`);
  return {
    largeArc: Number(match.groups.largeArc),
    x: Number(match.groups.x),
    y: Number(match.groups.y),
  };
};

describe("sectorPath", () => {
  it("starts every sector at the centre and 12 o'clock", () => {
    assert.ok(sectorPath(50, RADIUS).startsWith(`M ${RADIUS} ${RADIUS} L ${RADIUS} 0 A`));
  });

  it("sweeps clockwise: a quarter ends at 3 o'clock, a half at 6 o'clock", () => {
    const quarter = endpoint(sectorPath(25, RADIUS));
    assert.equal(quarter.largeArc, 0);
    assert.ok(Math.abs(quarter.x - RADIUS * 2) < 1e-9);
    assert.ok(Math.abs(quarter.y - RADIUS) < 1e-9);

    const half = endpoint(sectorPath(50, RADIUS));
    assert.equal(half.largeArc, 0);
    assert.ok(Math.abs(half.x - RADIUS) < 1e-9);
    assert.ok(Math.abs(half.y - RADIUS * 2) < 1e-9);
  });

  it("uses the large-arc flag past the halfway point", () => {
    assert.equal(endpoint(sectorPath(75, RADIUS)).largeArc, 1);
  });

  it("clamps out-of-range percentages", () => {
    assert.equal(sectorPath(-20, RADIUS), sectorPath(0, RADIUS));
    assert.equal(sectorPath(140, RADIUS), sectorPath(100, RADIUS));
  });
});
