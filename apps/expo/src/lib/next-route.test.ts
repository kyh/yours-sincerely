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
    assert.equal(resolveNextRoute("/missing"), "/");
    assert.equal(resolveNextRoute("/posts/abc/replies"), "/");
    assert.equal(resolveNextRoute("/posts/%ZZ"), "/");
    assert.equal(resolveNextRoute("/posts/abc%2Fdef"), "/");
    assert.equal(resolveNextRoute("//evil.example"), "/");
    assert.equal(resolveNextRoute("https://evil.example/settings"), "/");
  });

  it("returns to a letter or writer after authentication", () => {
    assert.deepEqual(resolveNextRoute("/posts/letter-id"), {
      params: { "post-id": "letter-id" },
      pathname: "/posts/[post-id]",
    });
    assert.deepEqual(resolveNextRoute("/profile/writer-id?tab=letters"), {
      params: { tab: "letters", "user-id": "writer-id" },
      pathname: "/profile/[user-id]",
    });
    assert.deepEqual(resolveNextRoute("/settings?x=1"), {
      params: { x: "1" },
      pathname: "/settings",
    });
  });

  it("uses the route identity over a conflicting query parameter", () => {
    assert.deepEqual(resolveNextRoute("/posts/letter-id?post-id=other"), {
      params: { "post-id": "letter-id" },
      pathname: "/posts/[post-id]",
    });
  });

  it("rejects redirects that normalize into external destinations", () => {
    assert.equal(resolveNextRoute("/\\evil.example/settings"), "/");
    assert.equal(resolveNextRoute("/.//evil.example"), "/");
  });

  it("refuses a repeated param", () => {
    assert.equal(resolveNextRoute(["/settings", "/profile"]), "/");
  });
});
