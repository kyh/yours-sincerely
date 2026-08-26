import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { NextRequest } from "next/server";

import * as route from "./route";

/**
 * With no CSRF token in the protocol, this endpoint's cross-site posture is a
 * set of things typecheck cannot see: the SameSite cookie, the origin check
 * covering the same-site *cross-origin* case SameSite does not, and the absence
 * of CORS. Driving the real exported handlers pins the half that lives here:
 * dropping the origin check, adding CORS headers, exporting OPTIONS, or
 * admitting GET turns CI red instead of silently shipping a
 * cross-origin-reachable endpoint. The cookie half is pinned in
 * `packages/api/src/security-contracts.test.ts`.
 */

type PostOptions = { url?: string; origin?: string };

const post = ({
  url = "http://localhost:3000/api/orpc/block/listBlocks",
  origin,
}: PostOptions = {}) => {
  const headers = new Headers({ "content-type": "application/json" });
  if (origin !== undefined) headers.set("origin", origin);

  return route.POST(
    new NextRequest(url, { method: "POST", headers, body: JSON.stringify({ json: {} }) }),
  );
};

describe("rpc endpoint", () => {
  test("runs a POST against the procedure, which answers without a session", async () => {
    const response = await post();
    assert.strictEqual(response.status, 401);
    assert.match(await response.text(), /UNAUTHORIZED/);
  });

  test("refuses GET, the one method a cross-site navigation can reach", async () => {
    const response = await route.GET(
      new NextRequest("http://localhost:3000/api/orpc/block/listBlocks", { method: "GET" }),
    );
    assert.strictEqual(response.status, 404);
  });

  // A sibling `*.yourssincerely.org` host is a different ORIGIN but the same
  // SITE, so SameSite=lax attaches the session cookie to a form POST from it.
  test("refuses a POST whose Origin is another origin, even a same-site one", async () => {
    const response = await post({
      url: "https://yourssincerely.org/api/orpc/block/listBlocks",
      origin: "https://evil.yourssincerely.org",
    });
    assert.strictEqual(response.status, 403);
  });

  test("allows a POST whose Origin is the app itself", async () => {
    const response = await post({
      url: "https://yourssincerely.org/api/orpc/block/listBlocks",
      origin: "https://yourssincerely.org",
    });
    assert.strictEqual(response.status, 401);
    assert.match(await response.text(), /UNAUTHORIZED/);
  });

  // React Native sends no Origin and carries the session from its own store, so
  // there is no ambient cookie another page could ride into a mutation.
  test("allows a POST with no Origin at all, so the Expo app still reaches it", async () => {
    const response = await post();
    assert.strictEqual(response.status, 401);
    assert.match(await response.text(), /UNAUTHORIZED/);
  });

  test("serves no CORS headers, so a cross-origin fetch cannot read a response", async () => {
    const response = await post();
    assert.strictEqual(response.headers.get("access-control-allow-origin"), null);
  });

  test("exports no OPTIONS handler", () => {
    assert.ok(!("OPTIONS" in route));
  });
});
