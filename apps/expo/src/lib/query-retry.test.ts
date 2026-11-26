import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ORPCError } from "@orpc/client";
import { QueryClient } from "@tanstack/react-query";

import { shouldRetryQuery } from "./query-retry.ts";

const countAttempts = async (error: Error) => {
  const queryClient = new QueryClient();
  let attempts = 0;
  await assert.rejects(
    queryClient.query({
      queryFn: () => {
        attempts += 1;
        throw error;
      },
      queryKey: ["retry"],
      retry: shouldRetryQuery,
      retryDelay: 0,
    }),
    error,
  );
  queryClient.clear();

  return attempts;
};

describe("shouldRetryQuery", () => {
  it("fails a request the server rejected for good on the first answer", async () => {
    const codes = ["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "CONFLICT"];

    const attempts = await Promise.all(
      codes.map(async (code) => await countAttempts(new ORPCError(code))),
    );

    assert.deepEqual(attempts, [1, 1, 1, 1, 1]);
  });

  it("retries network and server failures three times", async () => {
    assert.equal(await countAttempts(new TypeError("Network request failed")), 4);
    assert.equal(await countAttempts(new ORPCError("INTERNAL_SERVER_ERROR")), 4);
  });
});
