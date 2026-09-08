import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveNextRoute } from "./next-route.ts";

describe("resolveNextRoute", () => {
  it("accepts every allowlisted route verbatim", () => {
    for (const route of ["/", "/settings", "/notifications", "/profile"]) {
      assert.equal(resolveNextRoute(route), route);
    }
  });

  it("falls back to home for anything else", () => {
    assert.equal(resolveNextRoute(), "/");
    assert.equal(resolveNextRoute(""), "/");
    assert.equal(resolveNextRoute("/settings?x=1"), "/");
    assert.equal(resolveNextRoute("/posts/abc"), "/");
    assert.equal(resolveNextRoute("//evil.example"), "/");
    assert.equal(resolveNextRoute("https://evil.example/settings"), "/");
  });

  it("refuses a repeated param", () => {
    assert.equal(resolveNextRoute(["/settings", "/profile"]), "/");
  });
});
