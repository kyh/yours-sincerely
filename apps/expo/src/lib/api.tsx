import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import type { AppRouter } from "@repo/api";

import { fetchWithSession } from "./api-fetch";
import { getBaseUrl } from "./base-url";

export const queryClient = new QueryClient();

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
