import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { version as orpcClientVersion } from "@orpc/client/package.json";
import { NextRequest } from "next/server";
import { z } from "zod";

import { ORPC_CLIENT_HEADER } from "@repo/contract/rpc-client";
import * as route from "./route";

/**
 * With no CSRF token in the protocol, this endpoint's cross-site posture is a
 * set of things typecheck cannot see: the SameSite cookie, the origin check
 * covering the same-site *cross-origin* case SameSite does not, and the absence
 * of CORS. Driving the real exported handlers pins the half that lives here:
 * dropping the origin check, adding CORS headers, exporting OPTIONS, or
 * admitting GET turns CI red instead of silently shipping a
 * cross-origin-reachable endpoint. The cookie half is pinned in
 * `packages/service/src/security-contracts.test.ts`.
 */

interface PostOptions {
  url?: string;
  origin?: string;
  /** The `@orpc/client` version the caller names, as current builds do. */
  client?: string;
}

const post = ({
  url = "http://localhost:3000/api/orpc/block/listBlocks",
  origin,
  client,
}: PostOptions = {}) => {
  const headers = new Headers({ "content-type": "application/json" });
  if (origin !== undefined) {
    headers.set("origin", origin);
  }
  if (client !== undefined) {
    headers.set(ORPC_CLIENT_HEADER, client);
  }

  return route.POST(
    new NextRequest(url, { body: JSON.stringify({ json: {} }), headers, method: "POST" }),
  );
};

describe("rpc endpoint", () => {
  test("runs a POST against the procedure, which answers without a session", async () => {
    const response = await post();
    assert.strictEqual(response.status, 401);
    assert.match(await response.text(), /UNAUTHORIZED/u);
  });

  // Not exported, so Next answers 405 before any of this code runs: no session
  // lookup, no renewal cookie, for a method no client uses.
  test("exports no GET handler, the one method a cross-site navigation can reach", () => {
    assert.ok(!("GET" in route));
  });

  // A sibling `*.yourssincerely.org` host is a different ORIGIN but the same
  // SITE, so SameSite=lax attaches the session cookie to a form POST from it.
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

  // React Native sends no Origin and carries the session from its own store, so
  // there is no ambient cookie another page could ride into a mutation.
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

const rpcError = z.object({ json: z.looseObject({ code: z.string() }) });

// What oRPC 2.0.0-beta.31's client accepts as an error body: these keys and no
// others, with `inferable` among those it requires.
const BETA_31_ERROR_KEYS = new Set(["code", "data", "defined", "inferable", "message"]);

describe("rpc error body", () => {
  // Expo builds in the stores name no client and run beta.31.
  test("carries inferable for a call that names no oRPC client", async () => {
    const response = await post();
    const { json } = rpcError.parse(await response.json());
    assert.strictEqual(json.code, "UNAUTHORIZED");
    assert.strictEqual(json.inferable, false);
    assert.ok(Object.keys(json).every((key) => BETA_31_ERROR_KEYS.has(key)));
  });

  test("is oRPC's own for a call that names its client", async () => {
    const response = await post({ client: orpcClientVersion });
    const { json } = rpcError.parse(await response.json());
    assert.strictEqual(json.code, "UNAUTHORIZED");
    assert.ok(!("inferable" in json));
  });
});
