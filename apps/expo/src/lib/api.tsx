import { AppState, Platform } from "react-native";
import { focusManager, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

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

/**
 * Typesafe tRPC option builders — use with TanStack Query hooks:
 * `useQuery(trpc.post.getFeed.queryOptions({ limit: 5 }))`.
 *
 * NOTE: keep `httpBatchLink` (not the streaming variant) — session
 * `Set-Cookie` headers are only visible on buffered responses.
 */
export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: createTRPCClient({
    links: [
      loggerLink({
        enabled: (opts) => __DEV__ || (opts.direction === "down" && opts.result instanceof Error),
        colorMode: "ansi",
      }),
      httpBatchLink({
        transformer: superjson,
        url: `${getBaseUrl()}/api/trpc`,
        fetch: fetchWithSession,
        headers() {
          return { "x-trpc-source": "expo" };
        },
      }),
    ],
  }),
  queryClient,
});

export type { RouterOutputs } from "@repo/api";
