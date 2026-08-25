import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { NextRequest } from "next/server";

import * as route from "./route";

/**
 * The CSRF plugin and the absence of CORS live in transport config that
 * typecheck cannot see. Driving the real exported handlers pins the wiring:
 * removing the plugin, adding CORS headers, or exporting OPTIONS turns CI red
 * instead of silently shipping a less-guarded endpoint.
 */

const post = (headers: Record<string, string>) =>
  route.POST(
    new NextRequest("http://localhost:3000/api/orpc/block/listBlocks", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify({ json: {} }),
    }),
  );

describe("rpc endpoint", () => {
  test("rejects a POST without the CSRF header", async () => {
    const response = await post({});
    assert.strictEqual(response.status, 403);
    assert.match(await response.text(), /CSRF_TOKEN_MISMATCH/);
  });

  test("admits a POST carrying the header the link plugin sends", async () => {
    // 401, not 403: the request cleared the CSRF plugin and reached the
    // protected procedure without a session.
    const response = await post({ "x-csrf-token": "orpc" });
    assert.strictEqual(response.status, 401);
    assert.match(await response.text(), /UNAUTHORIZED/);
  });

  test("rejects GET on procedures", async () => {
    const response = await route.GET(
      new NextRequest("http://localhost:3000/api/orpc/block/listBlocks", {
        method: "GET",
        headers: { "x-csrf-token": "orpc" },
      }),
    );
    assert.strictEqual(response.status, 405);
  });

  test("serves no CORS headers, so cross-origin fetches cannot preflight in", async () => {
    const response = await post({});
    assert.strictEqual(response.headers.get("access-control-allow-origin"), null);
  });

  test("exports no OPTIONS handler", () => {
    assert.ok(!("OPTIONS" in route));
  });
});
