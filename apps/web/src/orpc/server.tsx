import { cache } from "react";
import { headers } from "next/headers";
import { appRouter, createORPCContext } from "@repo/api";
import { createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { FetchInfiniteQueryOptions, FetchQueryOptions, QueryKey } from "@tanstack/react-query";

import { createQueryClient } from "./query-client";

/**
 * Wraps `createORPCContext` and provides the required context when a React
 * Server Component calls a procedure.
 */
const createContext = cache(async () => {
  const heads = new Headers(await headers());

  return createORPCContext({
    headers: heads,
  });
});

const getQueryClient = cache(createQueryClient);

/**
 * Calls procedures in-process, with no HTTP round trip — so SSR never asks the
 * server to fetch from itself. Use directly for server-only rendering; use
 * `orpc` + `prefetch` when a client component will take the query over.
 */
export const caller = createRouterClient(appRouter, { context: createContext });

export const orpc = createTanstackQueryUtils(caller);

export const HydrateClient = (props: { children: React.ReactNode }) => {
  const queryClient = getQueryClient();
  return <HydrationBoundary state={dehydrate(queryClient)}>{props.children}</HydrationBoundary>;
};

export function prefetch<TQueryFnData, TError, TData, TQueryKey extends QueryKey>(
  queryOptions: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
) {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(queryOptions);
}

export function prefetchInfinite<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
  TPageParam,
>(queryOptions: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>) {
  const queryClient = getQueryClient();
  void queryClient.prefetchInfiniteQuery(queryOptions);
}
