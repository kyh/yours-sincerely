import assert from "node:assert/strict";
import test from "node:test";
import { ORPCError } from "@orpc/client";
import { dehydrate, environmentManager, hydrate } from "@tanstack/react-query";

import { createQueryClient } from "./query-client";

/** How many times a query asks before giving up on `error`. */
const countAttempts = async (error: Error) => {
  const queryClient = createQueryClient();
  let attempts = 0;
  await assert.rejects(
    queryClient.fetchQuery({
      queryFn: () => {
        attempts += 1;
        throw error;
      },
      queryKey: ["probe"],
      retryDelay: 0,
    }),
  );
  queryClient.clear();
  return attempts;
};

test("the browser retries transient failures, never a deterministic oRPC answer", async (t) => {
  environmentManager.setIsServer(() => false);
  t.after(() => environmentManager.setIsServer(() => true));

  for (const code of ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "CONFLICT"]) {
    assert.equal(await countAttempts(new ORPCError(code)), 1, code);
  }
  assert.equal(await countAttempts(new ORPCError("INTERNAL_SERVER_ERROR")), 4);
  assert.equal(await countAttempts(new TypeError("Failed to fetch")), 4);
});

/** The same client backs the RSC prefetches; a retry there stalls the render. */
test("the server never retries", async () => {
  assert.equal(environmentManager.isServer(), true);
  assert.equal(await countAttempts(new ORPCError("INTERNAL_SERVER_ERROR")), 1);
});

/**
 * The RSC prefetch dehydrates on the server and the browser hydrates the same
 * payload, so `dehydrate.serializeData` and `hydrate.deserializeData` have to
 * be inverses across a JSON boundary. Get one side wrong — plain JSON, or the
 * wrong half of the serializer's `{ json, meta }` — and the client silently
 * receives a string where the server had a Date, on every prefetched query.
 */
test("dehydrated query data survives the JSON boundary with its rich types", () => {
  const key = ["post", "getFeed", { input: { limit: 5 } }];
  const data = {
    at: new Date("2020-01-01T00:00:00.000Z"),
    big: 123n,
    lookup: new Map([[1, "one"]]),
    tags: new Set(["a", "b"]),
    url: new URL("https://example.com/path?q=1"),
  };

  const server = createQueryClient();
  server.setQueryData(key, data);

  const client = createQueryClient();
  hydrate(client, structuredClone(dehydrate(server)));

  // Same key, not just same value: the server's hash has to be the one the
  // browser looks the entry up under, or the page refetches what it prefetched.
  assert.deepStrictEqual(client.getQueryData(key), data);
});
