"use client";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";

import type { ContractClient } from "@repo/contract";
import { persistLegacySession } from "./persist-legacy-session";
import { createQueryClient } from "./query-client";

let clientQueryClientSingleton: QueryClient | undefined;

const getQueryClient = () => {
  if (typeof window === "undefined") {
    return createQueryClient();
  }

  return (clientQueryClientSingleton ??= createQueryClient());
};

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
    await persistLegacySession();

    return response;
  },
  headers: () => ({ "x-orpc-source": "nextjs-react" }),
  interceptors: [
    async (options) => {
      try {
        return await options.next();
      } catch (error) {
        const aborted = error instanceof Error && error.name === "AbortError";

        if (!aborted && process.env.NODE_ENV === "development") {
          console.error(error);
        }

        throw error;
      }
    },
  ],
  origin: () => getBaseUrl(),
  url: "/api/orpc",
});

const client: ContractClient = createORPCClient(link);

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
