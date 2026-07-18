import assert from "node:assert/strict";
import test from "node:test";

import {
  isDarkThemeId,
  isThemeId,
  nextFeedLayout,
  parseFeedLayout,
  type FeedLayout,
  type ThemeId,
} from "./preferences.ts";

test("parseFeedLayout only recognizes 'stack'; everything else is 'list'", () => {
  assert.equal(parseFeedLayout("stack"), "stack");
  assert.equal(parseFeedLayout("list"), "list");
  assert.equal(parseFeedLayout(undefined), "list");
  assert.equal(parseFeedLayout(""), "list");
  assert.equal(parseFeedLayout("Stack"), "list", "matching is case-sensitive");
  assert.equal(parseFeedLayout("grid"), "list", "unknown values fall back, they never throw");
});

test("nextFeedLayout toggles between the two layouts", () => {
  assert.equal(nextFeedLayout("list"), "stack");
  assert.equal(nextFeedLayout("stack"), "list");
});

test("nextFeedLayout is its own inverse", () => {
  for (const layout of ["list", "stack"] satisfies FeedLayout[]) {
    assert.equal(nextFeedLayout(nextFeedLayout(layout)), layout);
  }
});

test("isThemeId accepts exactly the five known themes", () => {
  const known = ["system", "light", "dark", "light-purple", "dark-purple"] satisfies ThemeId[];

  for (const theme of known) {
    assert.equal(isThemeId(theme), true, theme);
  }
});

test("isThemeId rejects anything else", () => {
  for (const value of ["", "Light", "purple", "dark_purple", "solarized", "system "]) {
    assert.equal(isThemeId(value), false, value);
  }
});

test("isDarkThemeId is true only for the dark variants", () => {
  assert.equal(isDarkThemeId("dark"), true);
  assert.equal(isDarkThemeId("dark-purple"), true);

  assert.equal(isDarkThemeId("light"), false);
  assert.equal(isDarkThemeId("light-purple"), false);
  // "system" is NOT dark — resolving it needs the OS preference, which this pure
  // predicate deliberately does not know about.
  assert.equal(isDarkThemeId("system"), false);
  assert.equal(isDarkThemeId(undefined), false);
});
