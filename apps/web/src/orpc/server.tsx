import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { appRouter, createORPCContext } from "@repo/service";
import { ORPCError, createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { dehydrate, HydrationBoundary, noop } from "@tanstack/react-query";
import type {
  DefaultError,
  InfiniteQueryExecuteOptions,
  QueryExecuteOptions,
  QueryKey,
} from "@tanstack/react-query";

import { createQueryClient } from "./query-client";

const createContext = cache(async () => {
  const heads = new Headers(await headers());

  return await createORPCContext({
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
  queryOptions: QueryExecuteOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>,
) => {
  const queryClient = getQueryClient();
  void queryClient.query(queryOptions).catch(noop);
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
  queryOptions: QueryExecuteOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>,
) => {
  try {
    return await getQueryClient().query(queryOptions);
  } catch (error) {
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
  queryOptions: InfiniteQueryExecuteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
) => {
  const queryClient = getQueryClient();
  void queryClient.infiniteQuery(queryOptions).catch(noop);
};
