import assert from "node:assert/strict";
import { test } from "node:test";

import {
  resolveRuntimeConnectionUrl,
  toDirectConnectionUrl,
  withLockTimeout,
} from "./connection-url";

/** `pnpm db:push` runs drizzle-kit and then the applier. If these two ever resolve
    to different databases, or to the pooler, the deploy is silently wrong — so the
    edge cases below are pinned rather than reasoned about at 2am. */

test("rewrites a Supabase pooler URL to the direct port", () => {
  assert.equal(
    toDirectConnectionUrl(
      "postgres://postgres.abc:s3cr3t@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
    ),
    "postgres://postgres.abc:s3cr3t@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
  );
});

test("rewrites when a query string follows", () => {
  assert.equal(
    toDirectConnectionUrl("postgres://u:p@host:6543/db?sslmode=require"),
    "postgres://u:p@host:5432/db?sslmode=require",
  );
});

test("rewrites when there is no path at all", () => {
  assert.equal(toDirectConnectionUrl("postgres://u:p@host:6543"), "postgres://u:p@host:5432");
});

test("leaves local Supabase alone", () => {
  // 54322 contains no `:6543`, but it is the URL everyone actually develops
  // against, so a rewrite that touched it would break every local push.
  assert.equal(
    toDirectConnectionUrl("postgresql://postgres:postgres@127.0.0.1:54322/postgres"),
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  );
});

test("leaves an already-direct URL alone", () => {
  assert.equal(toDirectConnectionUrl("postgres://u:p@host:5432/db"), "postgres://u:p@host:5432/db");
});

test("does not corrupt a password that contains the pooler port", () => {
  // The whole reason this is not `String.replace(":6543", ":5432")`: that replaces
  // the FIRST occurrence, which here is inside the password — corrupting the
  // credential and leaving the real port on the pooler. Both failures at once.
  assert.equal(
    toDirectConnectionUrl("postgres://u:pw:6543@host:6543/db"),
    "postgres://u:pw:6543@host:5432/db",
  );
});

test("does not re-encode the password", () => {
  // The reason this is not `new URL()` + `.port =` + `.toString()`: that serializer
  // round-trip rewrites `pw:6543` to `pw%3A6543`, which only survives if the driver
  // percent-decodes. Byte-identical except the port is the contract here.
  const url = "postgres://postgres.abc:p@ss:w%3Aord@host:6543/postgres";
  assert.equal(toDirectConnectionUrl(url), url.replace("host:6543", "host:5432"));
});

test("is idempotent", () => {
  const once = toDirectConnectionUrl("postgres://u:p@host:6543/db");
  assert.equal(toDirectConnectionUrl(once), once);
});

const startupOptions = (url: string) => new URL(url).searchParams.getAll("options");

test("adds lock_timeout as a startup option", () => {
  const url = withLockTimeout("postgres://u:p@host:5432/db", "5s");
  assert.deepEqual(startupOptions(url), ["-c lock_timeout=5s"]);
});

test("keeps the query parameters already there", () => {
  const url = withLockTimeout("postgres://u:p@host:5432/db?sslmode=require", "5s");
  assert.equal(new URL(url).searchParams.get("sslmode"), "require");
  assert.deepEqual(startupOptions(url), ["-c lock_timeout=5s"]);
});

test("appends to existing startup options instead of replacing them", () => {
  const url = withLockTimeout("postgres://u:p@host:5432/db?options=-c%20search_path%3Dx", "5s");
  assert.deepEqual(startupOptions(url), ["-c search_path=x -c lock_timeout=5s"]);
});

test("leaves everything before the query byte-identical", () => {
  const base = "postgres://postgres.abc:p@ss:w%3Aord@host:5432/postgres";
  assert.ok(withLockTimeout(`${base}?sslmode=require`, "5s").startsWith(`${base}?`));
});

test("uses POSTGRES_URL whenever it is set", () => {
  assert.equal(
    resolveRuntimeConnectionUrl({ NODE_ENV: "production", POSTGRES_URL: "postgres://prod/db" }),
    "postgres://prod/db",
  );
});

test("falls back to local Supabase outside production", () => {
  assert.equal(
    resolveRuntimeConnectionUrl({ NODE_ENV: "development", POSTGRES_URL: undefined }),
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  );
});

test("refuses to start in production without POSTGRES_URL", () => {
  // Hosts commonly hand an unset-but-declared variable over as "".
  for (const POSTGRES_URL of [undefined, ""]) {
    assert.throws(
      () => resolveRuntimeConnectionUrl({ NODE_ENV: "production", POSTGRES_URL }),
      /Missing POSTGRES_URL/u,
    );
  }
});
