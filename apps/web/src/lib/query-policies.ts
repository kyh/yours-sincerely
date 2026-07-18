import type { AppRouter } from "@repo/api";
import type { QueryClient } from "@tanstack/react-query";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";

/**
 * Scoped cache-invalidation policies for web mutations.
 *
 * There is deliberately NO global `mutations.onSuccess` default on the query
 * client: TanStack merges mutation options by spread, so a per-mutation
 * `onSuccess` silently REPLACES the default instead of chaining with it. A
 * blanket default therefore only ever fires for the mutations that don't need
 * it, and never for the ones that do. Every mutation calls a policy here
 * explicitly instead — if you add a `useMutation`, add its invalidation too.
 *
 * Mirrors `apps/expo/src/lib/query-policies.ts` in intent. It cannot share that
 * code: expo has a module-level singleton query client, while web builds one per
 * request (`apps/web/src/trpc/query-client.ts`), so the client is a parameter.
 */
type Trpc = TRPCOptionsProxy<AppRouter>;

export const refreshWorkspaceIdentity = (queryClient: QueryClient, trpc: Trpc) =>
  queryClient.invalidateQueries(trpc.auth.workspace.queryFilter());

/** Content mutations (like/flag/post) only change identity when they mint the
    anonymous user — skip the workspace roundtrip once a user exists. */
export const refreshWorkspaceIdentityIfAnonymous = (queryClient: QueryClient, trpc: Trpc) => {
  const workspace = queryClient.getQueryData(trpc.auth.workspace.queryKey());
  return workspace === undefined || workspace.user === null
    ? refreshWorkspaceIdentity(queryClient, trpc)
    : Promise.resolve();
};

export const refreshPostContent = (queryClient: QueryClient, trpc: Trpc) =>
  Promise.all([
    queryClient.invalidateQueries(trpc.post.getFeed.infiniteQueryFilter()),
    queryClient.invalidateQueries(trpc.post.getPost.queryFilter()),
  ]);

export const refreshProfileData = (queryClient: QueryClient, trpc: Trpc) =>
  Promise.all([
    queryClient.invalidateQueries(trpc.post.getPostsByUser.queryFilter()),
    queryClient.invalidateQueries(trpc.user.getUser.queryFilter()),
    queryClient.invalidateQueries(trpc.user.getUserStats.queryFilter()),
  ]);

/** Blocking or unblocking changes both the viewer's block inventory and which
    letters the feed is allowed to show them. Refresh both, or an unblocked author
    stays invisible until a hard reload. */
export const refreshBlocks = (queryClient: QueryClient, trpc: Trpc) =>
  Promise.all([
    queryClient.invalidateQueries(trpc.block.listBlocks.queryFilter()),
    refreshPostContent(queryClient, trpc),
  ]);

export const refreshAfterPostCreated = (queryClient: QueryClient, trpc: Trpc) =>
  Promise.all([
    refreshWorkspaceIdentityIfAnonymous(queryClient, trpc),
    refreshPostContent(queryClient, trpc),
    refreshProfileData(queryClient, trpc),
  ]);
