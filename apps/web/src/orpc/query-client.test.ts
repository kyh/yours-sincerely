import assert from "node:assert/strict";
import test from "node:test";
import { dehydrate, hydrate } from "@tanstack/react-query";

import { createQueryClient } from "./query-client";

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
    tags: new Set(["a", "b"]),
    lookup: new Map([[1, "one"]]),
    big: 123n,
    url: new URL("https://example.com/path?q=1"),
  };

  const server = createQueryClient();
  server.setQueryData(key, data);

  const client = createQueryClient();
  hydrate(client, JSON.parse(JSON.stringify(dehydrate(server))));

  // Same key, not just same value: the server's hash has to be the one the
  // browser looks the entry up under, or the page refetches what it prefetched.
  assert.deepStrictEqual(client.getQueryData(key), data);
});
