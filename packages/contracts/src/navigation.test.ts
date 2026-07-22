import assert from "node:assert/strict";
import test from "node:test";

import { safeNextPath } from "./navigation.ts";

test("safeNextPath keeps same-origin absolute paths", () => {
  assert.equal(safeNextPath("/"), "/");
  assert.equal(safeNextPath("/settings"), "/settings");
  assert.equal(safeNextPath("/post/abc?tab=replies#top"), "/post/abc?tab=replies#top");
});

test("safeNextPath rejects protocol-relative URLs", () => {
  assert.equal(safeNextPath("//evil.example"), "/");
  assert.equal(safeNextPath("//evil.example/settings"), "/");
});

test("safeNextPath rejects backslash smuggling", () => {
  // For special schemes the WHATWG URL parser treats `\` as `/`, so these are
  // cross-origin even though they start with a single `/`.
  assert.equal(safeNextPath("/\\evil.example"), "/");
  assert.equal(safeNextPath("\\/evil.example"), "/");
  assert.equal(safeNextPath("/\\\\evil.example"), "/");
});

test("safeNextPath rejects paths that normalise into protocol-relative URLs", () => {
  // `new URL("/.//evil.example", origin)` is same-origin, but its pathname is
  // `//evil.example` — re-resolving that in the browser lands on evil.example.
  assert.equal(safeNextPath("/.//evil.example"), "/");
  assert.equal(safeNextPath("/..//evil.example"), "/");
  assert.equal(safeNextPath("/a/../..//evil.example"), "/");
});

test("safeNextPath rejects absolute cross-origin URLs", () => {
  assert.equal(safeNextPath("https://evil.example"), "/");
  assert.equal(safeNextPath("http://evil.example/settings"), "/");
  assert.equal(safeNextPath("https://next-path.invalid.evil.example"), "/");
});

test("safeNextPath rejects non-http schemes", () => {
  assert.equal(safeNextPath("javascript:alert(1)"), "/");
  assert.equal(safeNextPath("data:text/html,<script>alert(1)</script>"), "/");
  assert.equal(safeNextPath("mailto:someone@evil.example"), "/");
});

test("safeNextPath rejects anything that is not a single string", () => {
  assert.equal(safeNextPath(undefined), "/");
  assert.equal(safeNextPath(["/settings", "//evil.example"]), "/");
  assert.equal(safeNextPath([]), "/");
});

test("safeNextPath never returns a value that resolves off-origin", () => {
  const hostile = [
    "//evil.example",
    "/\\evil.example",
    "/.//evil.example",
    "https://evil.example",
    "javascript:alert(1)",
    "",
    "///evil.example",
    "/%2f/evil.example",
    "\t//evil.example",
    "/\r\n//evil.example",
  ];

  for (const value of hostile) {
    const result = safeNextPath(value);
    assert.equal(
      new URL(result, "https://yourssincerely.org").origin,
      "https://yourssincerely.org",
      `safeNextPath(${JSON.stringify(value)}) escaped the origin as ${result}`,
    );
  }
});
