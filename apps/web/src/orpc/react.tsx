"use client";

import { createORPCClient, onError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryClientProvider } from "@tanstack/react-query";

import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "@repo/api";
import { persistLegacySession } from "@/lib/persist-legacy-session";
import { createQueryClient } from "./query-client";

let clientQueryClientSingleton;
const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= createQueryClient());
};

// During SSR this link would fetch the app from itself without the viewer's
// cookie, rendering the wrong identity. Fail loudly instead: a client query
// that reaches it on the server has no dehydrated state. Either its page's RSC
// never prefetched it, or the prefetch rejected before `HydrateClient` ran. An
// errored query is not dehydrated, and `prefetch` swallows the rejection.
const getBaseUrl = () => {
  if (typeof window === "undefined") {
    throw new TypeError(
      "RPCLink called during SSR: the query was not prefetched in the page's server component (@/orpc/server), or its prefetch failed before the page dehydrated.",
    );
  }
  return window.location.origin;
};

const link = new RPCLink({
  fetch: async (url, init) => {
    const response = await fetch(url, init);
    // Reads can renew the session too; persist before exposing any RPC result.
    await persistLegacySession();
    return response;
  },
  headers: () => ({ "x-orpc-source": "nextjs-react" }),
  interceptors: [
    // oxlint-disable-next-line promise/prefer-await-to-callbacks -- oRPC interceptor, not a node-style callback
    onError((error) => {
      // StrictMode's dev remount cancels every in-flight query once; that
      // abort is not a failure worth an overlay entry.
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
    }),
  ],
  // Resolved per call, not at module load: this module is evaluated during SSR
  // too, where `window` is absent.
  origin: () => getBaseUrl(),
  url: "/api/orpc",
});

const client: RouterClient<AppRouter> = createORPCClient(link);

/**
 * Typesafe query/mutation option builders — use with TanStack Query hooks:
 * `useQuery(orpc.post.getPost.queryOptions({ input: { postId } }))`.
 *
 * A plain module export rather than a React context: oRPC's utils are built
 * from the client, and the browser only ever has one.
 */
export const orpc = createTanstackQueryUtils(client);

export const ORPCReactProvider = (props: { children: React.ReactNode }) => {
  const queryClient = getQueryClient();

  return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>;
};
