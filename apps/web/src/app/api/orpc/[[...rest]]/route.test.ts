import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { NextRequest } from "next/server";

import * as route from "./route";

interface PostOptions {
  url?: string;
  origin?: string;
}

const post = async ({
  url = "http://localhost:3000/api/orpc/block/listBlocks",
  origin,
}: PostOptions = {}) => {
  const headers = new Headers({ "content-type": "application/json" });

  if (origin !== undefined) {
    headers.set("origin", origin);
  }

  return await route.POST(
    new NextRequest(url, { body: JSON.stringify({ json: {} }), headers, method: "POST" }),
  );
};

describe("rpc endpoint", () => {
  test("runs a POST against the procedure, which answers without a session", async () => {
    const response = await post();
    assert.strictEqual(response.status, 401);
    assert.match(await response.text(), /UNAUTHORIZED/u);
  });

  test("exports no GET handler, the one method a cross-site navigation can reach", () => {
    assert.ok(!("GET" in route));
  });

  test("refuses a POST whose Origin is another origin, even a same-site one", async () => {
    const response = await post({
      origin: "https://evil.yourssincerely.org",
      url: "https://yourssincerely.org/api/orpc/block/listBlocks",
    });

    assert.strictEqual(response.status, 403);
  });

  test("allows a POST whose Origin is the app itself", async () => {
    const response = await post({
      origin: "https://yourssincerely.org",
      url: "https://yourssincerely.org/api/orpc/block/listBlocks",
    });

    assert.strictEqual(response.status, 401);
    assert.match(await response.text(), /UNAUTHORIZED/u);
  });

  test("allows a POST with no Origin at all, so the Expo app still reaches it", async () => {
    const response = await post();
    assert.strictEqual(response.status, 401);
    assert.match(await response.text(), /UNAUTHORIZED/u);
  });

  test("serves no CORS headers, so a cross-origin fetch cannot read a response", async () => {
    const response = await post();
    assert.strictEqual(response.headers.get("access-control-allow-origin"), null);
  });

  test("exports no OPTIONS handler", () => {
    assert.ok(!("OPTIONS" in route));
  });
});
