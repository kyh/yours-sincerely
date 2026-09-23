import { orpc, queryClient } from "./api";

/**
 * Scoped cache-invalidation policies for expo mutations. Mirrors
 * `apps/web/src/lib/query-policies.ts` in intent; expo's query client and
 * utils are module singletons, so no parameters.
 *
 * Filters are built from `.key()`, which prefix-matches: `key({ input })` hits
 * every query whose input starts with that shape, and `key()` hits every input.
 */
/** Retained tabs must drop the previous identity and refetch through their existing observers. */
export const resetAfterSessionChanged = () => {
  queryClient.getMutationCache().clear();
  // Signed-in-only data: a reset would refetch it with the new (or no) cookie
  // before its user-gated consumers see the workspace change and unmount.
  queryClient.removeQueries({ queryKey: orpc.notification.key() });
  queryClient.removeQueries({ queryKey: orpc.block.listBlocks.key() });
  return queryClient.resetQueries();
};

export const refreshWorkspaceIdentity = () =>
  queryClient.invalidateQueries({ queryKey: orpc.auth.workspace.key() });

/** Content mutations (like/flag/post) only change identity when they mint the
    anonymous user — skip the workspace roundtrip once a user exists. */
export const refreshWorkspaceIdentityIfAnonymous = () => {
  // `queryKey()` is a full match; `auth.workspace` takes no input, so this is
  // exactly the key `queryOptions()` stores the data under.
  const workspace = queryClient.getQueryData(orpc.auth.workspace.queryKey());
  return workspace === undefined || workspace.user === null
    ? refreshWorkspaceIdentity()
    : Promise.resolve();
};

export const refreshPostContent = () =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: orpc.post.getFeed.key({ type: "infinite" }) }),
    queryClient.invalidateQueries({ queryKey: orpc.post.getPost.key() }),
  ]);

/** For a like, whose response already carries the post's new state: stale, not
    refetched, because refetching an infinite query walks every loaded page in
    series, one round trip per page. */
export const markPostContentStale = () =>
  Promise.all([
    queryClient.invalidateQueries({
      queryKey: orpc.post.getFeed.key({ type: "infinite" }),
      refetchType: "none",
    }),
    queryClient.invalidateQueries({ queryKey: orpc.post.getPost.key(), refetchType: "none" }),
  ]);

export const refreshProfileData = () =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: orpc.post.getPostsByUser.key() }),
    queryClient.invalidateQueries({ queryKey: orpc.user.getUser.key() }),
    queryClient.invalidateQueries({ queryKey: orpc.user.getUserStats.key() }),
  ]);

/** Blocking or unblocking changes both the viewer's block inventory and which
    letters the feed is allowed to show them. Refresh both, or an unblocked author
    stays invisible until the app is restarted. */
export const refreshBlocks = () =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: orpc.block.listBlocks.key() }),
    refreshPostContent(),
  ]);

export const refreshAfterPostCreated = () =>
  Promise.all([refreshWorkspaceIdentityIfAnonymous(), refreshPostContent(), refreshProfileData()]);

/** A reply read or received changes both the list and the tab badge. */
export const refreshNotifications = () =>
  Promise.all([
    queryClient.invalidateQueries({
      queryKey: orpc.notification.list.key({ type: "infinite" }),
    }),
    queryClient.invalidateQueries({ queryKey: orpc.notification.unreadCount.key() }),
  ]);
