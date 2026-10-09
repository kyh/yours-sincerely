import { AppState, Platform } from "react-native";
import { createORPCClient, onError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { version as orpcClientVersion } from "@orpc/client/package.json";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { focusManager, QueryClient } from "@tanstack/react-query";

import type { ContractClient } from "@repo/contract";
import { ORPC_CLIENT_HEADER } from "@repo/contract/rpc-client";

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

// RN has no window focus events — drive refetch-on-focus from AppState so
// long-mounted tab screens refresh when the app returns to the foreground.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (status) => {
    focusManager.setFocused(status === "active");
  });
}

// TanStack aborts an in-flight fetch whenever it invalidates the same query,
// so a cancelled request is routine, not a failure worth a red box.
const isCancelledFetch = (error: Error) =>
  error.name === "AbortError" || /cancel/iu.test(error.message);

// RPCLink buffers each response, so the session `Set-Cookie` header stays
// visible to `fetchWithSession`'s cookie jar — a streaming transport would
// deliver the body before the wrapper could read it.
const link = new RPCLink({
  fetch: fetchWithSession,
  headers: () => ({ [ORPC_CLIENT_HEADER]: orpcClientVersion, "x-orpc-source": "expo" }),
  interceptors: [
    // oxlint-disable-next-line promise/prefer-await-to-callbacks -- oRPC interceptor, not a node-style callback
    onError((error) => {
      if (__DEV__ && !(error instanceof Error && isCancelledFetch(error))) {
        console.error(error);
      }
    }),
  ],
  // No SSR on React Native, so the origin is stable for the process.
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
