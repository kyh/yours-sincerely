import assert from "node:assert/strict";
import test from "node:test";
import { ORPCError } from "@orpc/client";
import { dehydrate, environmentManager, hydrate } from "@tanstack/react-query";

import { createQueryClient } from "./query-client";

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

test("the server never retries", async () => {
  assert.equal(environmentManager.isServer(), true);
  assert.equal(await countAttempts(new ORPCError("INTERNAL_SERVER_ERROR")), 1);
});

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

  assert.deepStrictEqual(client.getQueryData(key), data);
});
