import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { appRouter, createORPCContext } from "@repo/api";
import { ORPCError, createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type {
  DefaultError,
  FetchInfiniteQueryOptions,
  FetchQueryOptions,
  QueryKey,
} from "@tanstack/react-query";

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

export const prefetch = <TQueryFnData, TError, TData, TQueryKey extends QueryKey>(
  queryOptions: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
) => {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(queryOptions);
};

/**
 * Awaits the query a page cannot render without, and turns a missing resource
 * into `notFound()`. Call it before anything suspends: once the body streams,
 * the status is already 200 and a 404 can only be a `noindex` tag. The data
 * dehydrates as a success, so the client never suspends on it or retries it.
 */
export const fetchOrNotFound = async <
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  queryOptions: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
) => {
  try {
    return await getQueryClient().fetchQuery(queryOptions);
  } catch (error) {
    // BAD_REQUEST too: a malformed id in a URL names nothing that exists.
    if (
      error instanceof ORPCError &&
      (error.code === "NOT_FOUND" || error.code === "BAD_REQUEST")
    ) {
      notFound();
    }
    throw error;
  }
};

export const prefetchInfinite = <
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
  TPageParam,
>(
  queryOptions: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
) => {
  const queryClient = getQueryClient();
  void queryClient.prefetchInfiniteQuery(queryOptions);
};
