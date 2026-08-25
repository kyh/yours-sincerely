import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { NextRequest } from "next/server";

import * as route from "./route";

/**
 * With no CSRF token in the protocol, this endpoint's cross-site posture is the
 * SameSite cookie plus the absence of CORS — transport config typecheck cannot
 * see. Driving the real exported handlers pins the half that lives here: adding
 * CORS headers, exporting OPTIONS, or admitting GET turns CI red instead of
 * silently shipping a cross-origin-reachable endpoint. The cookie half is
 * pinned in `packages/api/src/security-contracts.test.ts`.
 */

const post = (headers: Record<string, string> = {}) =>
  route.POST(
    new NextRequest("http://localhost:3000/api/orpc/block/listBlocks", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify({ json: {} }),
    }),
  );

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

  test("serves no CORS headers, so a cross-origin fetch cannot read a response", async () => {
    const response = await post();
    assert.strictEqual(response.headers.get("access-control-allow-origin"), null);
  });

  test("exports no OPTIONS handler", () => {
    assert.ok(!("OPTIONS" in route));
  });
});
