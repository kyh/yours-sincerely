import assert from "node:assert/strict";
import test from "node:test";

import { DrizzleQueryError } from "drizzle-orm";

import { FOREIGN_KEY_VIOLATION, pgErrorCode, rethrowPgError } from "./pg-error.ts";

/** What drizzle throws for a query Postgres rejected: the driver's error, which
    carries the SQLSTATE, wrapped as the `cause`. */
const failedQuery = (code: string) =>
  new DrizzleQueryError(
    'insert into "Flag" ...',
    [],
    Object.assign(new Error("rejected"), { code }),
  );

test("pgErrorCode reads the SQLSTATE through drizzle's wrapper", () => {
  assert.equal(pgErrorCode(failedQuery(FOREIGN_KEY_VIOLATION)), FOREIGN_KEY_VIOLATION);
});

test("pgErrorCode is undefined for anything that is not a failed query", () => {
  assert.equal(pgErrorCode(new Error("boom")), undefined);
  assert.equal(pgErrorCode(Object.assign(new Error("unwrapped"), { code: "23503" })), undefined);
  assert.equal(pgErrorCode(new DrizzleQueryError("select 1", [])), undefined);
  assert.equal(pgErrorCode("23503"), undefined);
});

test("rethrowPgError replaces only the expected violation", async () => {
  const notFound = new Error("Post not found");

  await assert.rejects(
    rethrowPgError(
      Promise.reject(failedQuery(FOREIGN_KEY_VIOLATION)),
      FOREIGN_KEY_VIOLATION,
      () => notFound,
    ),
    (error) => error === notFound,
  );

  const unexpected = failedQuery("42P01");
  await assert.rejects(
    rethrowPgError(Promise.reject(unexpected), FOREIGN_KEY_VIOLATION, () => notFound),
    (error) => error === unexpected,
  );
});

test("rethrowPgError passes a successful write through", async () => {
  assert.deepEqual(
    await rethrowPgError(
      Promise.resolve([{ id: "p1" }]),
      FOREIGN_KEY_VIOLATION,
      () => new Error("unreachable"),
    ),
    [{ id: "p1" }],
  );
});
