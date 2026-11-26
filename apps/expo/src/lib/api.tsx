import { AppState, Platform } from "react-native";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { focusManager, QueryClient } from "@tanstack/react-query";

import type { ContractClient } from "@repo/contract";

import { fetchWithSession } from "./api-fetch";
import { getBaseUrl } from "./base-url";
import { shouldRetryQuery } from "./query-retry";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      staleTime: 30 * 1000,
    },
  },
});

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (status) => {
    focusManager.setFocused(status === "active");
  });
}

const isCancelledFetch = (error: Error) =>
  error.name === "AbortError" || /cancel/iu.test(error.message);

const link = new RPCLink({
  fetch: fetchWithSession,
  headers: () => ({ "x-orpc-source": "expo" }),
  interceptors: [
    async (options) => {
      try {
        return await options.next();
      } catch (error) {
        if (__DEV__ && !(error instanceof Error && isCancelledFetch(error))) {
          console.error(error);
        }

        throw error;
      }
    },
  ],
  origin: getBaseUrl(),
  url: "/api/orpc",
});

const client: ContractClient = createORPCClient(link);

/**
 * Typesafe query/mutation option builders — use with TanStack Query hooks:
 * `useQuery(orpc.post.getFeed.queryOptions({ input: { limit: 5 } }))`.
 */
export const orpc = createTanstackQueryUtils(client);

export type { FeedFilters, FeedPost, RouterOutputs } from "@repo/contract";
