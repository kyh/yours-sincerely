import assert from "node:assert/strict";
import test from "node:test";

import { matchHotkeys } from "./use-hotkey";
import type { Hotkey } from "./use-hotkey";

const next = () => "next";
const previous = () => "previous";
const hotkeys: Hotkey[] = [
  [" ", next],
  ["arrowleft", previous],
  ["arrowright", next],
];

const keydown = (key: string, overrides: Partial<Parameters<typeof matchHotkeys>[1]> = {}) => ({
  altKey: false,
  ctrlKey: false,
  defaultPrevented: false,
  key,
  metaKey: false,
  shiftKey: false,
  ...overrides,
});

test("space and the arrows advance the stack when focus is not in a field", () => {
  assert.deepEqual(matchHotkeys(hotkeys, keydown(" "), false), [next]);
  assert.deepEqual(matchHotkeys(hotkeys, keydown("ArrowLeft"), false), [previous]);
  assert.deepEqual(matchHotkeys(hotkeys, keydown("ArrowRight"), false), [next]);
});

test("keys typed into an editable field never reach the stack", () => {
  for (const key of [" ", "ArrowLeft", "ArrowRight"]) {
    assert.deepEqual(matchHotkeys(hotkeys, keydown(key), true), [], key);
  }
});

test("a modifier keeps the key for the browser", () => {
  for (const modifier of ["altKey", "ctrlKey", "metaKey", "shiftKey"] as const) {
    assert.deepEqual(
      matchHotkeys(hotkeys, keydown("ArrowLeft", { [modifier]: true }), false),
      [],
      modifier,
    );
  }
});

test("an event another handler already consumed is ignored", () => {
  assert.deepEqual(matchHotkeys(hotkeys, keydown(" ", { defaultPrevented: true }), false), []);
});

test("unbound keys match nothing", () => {
  assert.deepEqual(matchHotkeys(hotkeys, keydown("Enter"), false), []);
});
