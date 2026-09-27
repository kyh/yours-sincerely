import assert from "node:assert/strict";
import { test } from "node:test";

import { WEB_ORIGIN } from "@repo/contracts/site";

import { envSchema } from "./env.ts";

test("a malformed RESET_LINK_ORIGIN falls back to production instead of failing boot", () => {
  for (const value of ["yourssincerely.org", "https://", '"https://example.org"', "", "  "]) {
    assert.equal(
      envSchema.parse({ RESET_LINK_ORIGIN: value }).RESET_LINK_ORIGIN,
      WEB_ORIGIN,
      value,
    );
  }
  assert.equal(envSchema.parse({}).RESET_LINK_ORIGIN, WEB_ORIGIN);
});

test("a valid RESET_LINK_ORIGIN is used as given", () => {
  const origin = "https://preview.example.com";
  assert.equal(envSchema.parse({ RESET_LINK_ORIGIN: origin }).RESET_LINK_ORIGIN, origin);
});
