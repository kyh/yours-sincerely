import type { RouterClient } from "@orpc/server";
import type { RouterUtils } from "@orpc/tanstack-query";
import type { AppRouter } from "@repo/api";
import type { QueryClient } from "@tanstack/react-query";

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
 * request (`apps/web/src/orpc/query-client.ts`), so the client is a parameter.
 *
 * Filters are built from `.key()`, which prefix-matches: `key({ input })` hits
 * every query whose input starts with that shape, and `key()` hits every input.
 */
type Orpc = RouterUtils<RouterClient<AppRouter>>;

export const refreshWorkspaceIdentity = (queryClient: QueryClient, orpc: Orpc) =>
  queryClient.invalidateQueries({ queryKey: orpc.auth.workspace.key() });

/** Content mutations (like/flag/post) only change identity when they mint the
    anonymous user — skip the workspace roundtrip once a user exists. */
export const refreshWorkspaceIdentityIfAnonymous = (queryClient: QueryClient, orpc: Orpc) => {
  // `queryKey()` is a full match; `auth.workspace` takes no input, so this is
  // exactly the key `queryOptions()` stores the data under.
  const workspace = queryClient.getQueryData(orpc.auth.workspace.queryKey());
  return workspace === undefined || workspace.user === null
    ? refreshWorkspaceIdentity(queryClient, orpc)
    : Promise.resolve();
};

export const refreshPostContent = (queryClient: QueryClient, orpc: Orpc) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: orpc.post.getFeed.key({ type: "infinite" }) }),
    queryClient.invalidateQueries({ queryKey: orpc.post.getPost.key() }),
  ]);

export const refreshProfileData = (queryClient: QueryClient, orpc: Orpc) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: orpc.post.getPostsByUser.key() }),
    queryClient.invalidateQueries({ queryKey: orpc.user.getUser.key() }),
    queryClient.invalidateQueries({ queryKey: orpc.user.getUserStats.key() }),
  ]);

/** Blocking or unblocking changes both the viewer's block inventory and which
    letters the feed is allowed to show them. Refresh both, or an unblocked author
    stays invisible until a hard reload. */
export const refreshBlocks = (queryClient: QueryClient, orpc: Orpc) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: orpc.block.listBlocks.key() }),
    refreshPostContent(queryClient, orpc),
  ]);

export const refreshAfterPostCreated = (queryClient: QueryClient, orpc: Orpc) =>
  Promise.all([
    refreshWorkspaceIdentityIfAnonymous(queryClient, orpc),
    refreshPostContent(queryClient, orpc),
    refreshProfileData(queryClient, orpc),
  ]);
