import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CounterState } from "./odometer.ts";
import { nextCounterState, odometerColumns } from "./odometer.ts";

const MOTION = false;
const REDUCED = true;

describe("nextCounterState", () => {
  it("stays plain text, and returns the same state, while the value holds", () => {
    const state: CounterState = { from: null, value: 3 };
    assert.equal(nextCounterState(state, 3, MOTION), state);
  });

  it("starts the odometer from the value that was showing on the first change", () => {
    assert.deepEqual(nextCounterState({ from: null, value: 3 }, 4, MOTION), {
      from: 3,
      value: 4,
    });
  });

  it("tracks the value before each later change", () => {
    const first = nextCounterState({ from: null, value: 3 }, 4, MOTION);
    assert.deepEqual(nextCounterState(first, 2, MOTION), { from: 4, value: 2 });
  });

  it("returns the same state once settled, so render-time updates converge", () => {
    const changed = nextCounterState({ from: null, value: 3 }, 4, MOTION);
    assert.equal(nextCounterState(changed, 4, MOTION), changed);
  });

  it("stays plain text through changes under reduce motion", () => {
    assert.deepEqual(nextCounterState({ from: null, value: 3 }, 4, REDUCED), {
      from: null,
      value: 4,
    });
  });

  it("forgets the previous value when reduce motion turns on", () => {
    const reduced = nextCounterState({ from: 3, value: 4 }, 4, REDUCED);
    assert.deepEqual(reduced, { from: null, value: 4 });
    assert.equal(nextCounterState(reduced, 4, REDUCED), reduced);
    assert.equal(nextCounterState(reduced, 4, MOTION), reduced);
  });
});

describe("odometerColumns", () => {
  it("keys columns by place value, ones first from the right", () => {
    assert.deepEqual(
      odometerColumns(120, 119).map(({ position }) => position),
      [2, 1, 0],
    );
  });

  it("starts each column on the digit its place held before the change", () => {
    assert.deepEqual(odometerColumns(4, 3), [{ digit: 4, from: 3, position: 0 }]);
    assert.deepEqual(odometerColumns(20, 19), [
      { digit: 2, from: 1, position: 1 },
      { digit: 0, from: 9, position: 0 },
    ]);
  });

  it("marks a leading place the previous value lacked as new", () => {
    assert.deepEqual(odometerColumns(10, 9), [
      { digit: 1, from: null, position: 1 },
      { digit: 0, from: 9, position: 0 },
    ]);
  });

  it("drops places the value no longer has", () => {
    assert.deepEqual(odometerColumns(9, 10), [{ digit: 9, from: 0, position: 0 }]);
  });
});
