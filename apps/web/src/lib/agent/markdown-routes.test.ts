import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { resolveMarkdownRoute } from "./markdown-routes";

describe("resolveMarkdownRoute", () => {
  test("maps the pages that have a Markdown twin", () => {
    assert.deepEqual(resolveMarkdownRoute("/"), { kind: "home" });
    assert.deepEqual(resolveMarkdownRoute("/about"), { kind: "about" });
    assert.deepEqual(resolveMarkdownRoute("/contact/"), { kind: "contact" });
    assert.deepEqual(resolveMarkdownRoute("/privacy"), { kind: "privacy" });
  });

  test("reads a letter id from its permalink", () => {
    assert.deepEqual(resolveMarkdownRoute("/posts/abc123"), { kind: "letter", postId: "abc123" });
    assert.deepEqual(resolveMarkdownRoute("/posts/abc123/extra"), { kind: "not-found" });
    assert.deepEqual(resolveMarkdownRoute("/posts"), { kind: "not-found" });
  });

  test("keeps live HTML-only screens out of the 404 path", () => {
    for (const path of ["/terms", "/settings", "/notifications", "/profile/u1", "/auth/sign-in"]) {
      assert.deepEqual(resolveMarkdownRoute(path), { kind: "html-only" }, path);
    }
  });

  test("treats anything else as missing", () => {
    assert.deepEqual(resolveMarkdownRoute("/__probe-404"), { kind: "not-found" });
    assert.deepEqual(resolveMarkdownRoute("/constructor"), { kind: "not-found" });
    assert.deepEqual(resolveMarkdownRoute("/about-us"), { kind: "not-found" });
  });
});
