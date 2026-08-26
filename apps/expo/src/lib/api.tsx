import { AppState, Platform } from "react-native";
import { createORPCClient, onError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { focusManager, QueryClient } from "@tanstack/react-query";

import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "@repo/api";

import { fetchWithSession } from "./api-fetch";
import { getBaseUrl } from "./base-url";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
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

// RPCLink buffers each response, so the session `Set-Cookie` header stays
// visible to `fetchWithSession`'s cookie jar — a streaming transport would
// deliver the body before the wrapper could read it.
const link = new RPCLink({
  // No SSR on React Native, so the origin is stable for the process.
  origin: getBaseUrl(),
  url: "/api/orpc",
  fetch: fetchWithSession,
  headers: () => ({ "x-orpc-source": "expo" }),
  interceptors: [
    onError((error) => {
      if (__DEV__) console.error(error);
    }),
  ],
});

const client: RouterClient<AppRouter> = createORPCClient(link);

/**
 * Typesafe query/mutation option builders — use with TanStack Query hooks:
 * `useQuery(orpc.post.getFeed.queryOptions({ input: { limit: 5 } }))`.
 */
export const orpc = createTanstackQueryUtils(client);

export type { RouterOutputs } from "@repo/api";
