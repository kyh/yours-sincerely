import assert from "node:assert/strict";
import { test } from "node:test";

import {
  resolveRuntimeConnectionUrl,
  toDirectConnectionUrl,
  withLockTimeout,
} from "./connection-url";

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
  assert.equal(
    toDirectConnectionUrl("postgresql://postgres:postgres@127.0.0.1:26543/postgres"),
    "postgresql://postgres:postgres@127.0.0.1:26543/postgres",
  );
});

test("leaves an already-direct URL alone", () => {
  assert.equal(toDirectConnectionUrl("postgres://u:p@host:5432/db"), "postgres://u:p@host:5432/db");
});

test("does not corrupt a password that contains the pooler port", () => {
  assert.equal(
    toDirectConnectionUrl("postgres://u:pw:6543@host:6543/db"),
    "postgres://u:pw:6543@host:5432/db",
  );
});

test("does not re-encode the password", () => {
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

test("falls back only under test, to a URL nothing listens on", () => {
  assert.equal(
    resolveRuntimeConnectionUrl({ NODE_ENV: "test", POSTGRES_URL: undefined }),
    "postgresql://postgres:postgres@127.0.0.1:1/postgres",
  );
});

test("refuses to start without POSTGRES_URL everywhere else", () => {
  for (const NODE_ENV of ["production", "development", undefined]) {
    for (const POSTGRES_URL of [undefined, ""]) {
      assert.throws(
        () => resolveRuntimeConnectionUrl({ NODE_ENV, POSTGRES_URL }),
        /Missing POSTGRES_URL/u,
      );
    }
  }
});
