import { orpc, queryClient } from "./api";

/** Retained tabs must drop the previous identity and refetch through their existing observers. */
export const resetAfterSessionChanged = async () => {
  queryClient.getMutationCache().clear();
  queryClient.removeQueries({ queryKey: orpc.notification.key() });
  queryClient.removeQueries({ queryKey: orpc.block.listBlocks.key() });

  await queryClient.resetQueries();
};

export const refreshWorkspaceIdentity = async () => {
  await queryClient.invalidateQueries({ queryKey: orpc.auth.workspace.key() });
};

/** Content mutations (like/flag/post) only change identity when they mint the
    anonymous user — skip the workspace roundtrip once a user exists. */
export const refreshWorkspaceIdentityIfAnonymous = async () => {
  const workspace = queryClient.getQueryData(orpc.auth.workspace.queryKey());

  if (workspace === undefined || workspace.user === null) {
    await refreshWorkspaceIdentity();
  }
};

export const refreshPostContent = async () =>
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: orpc.post.getFeed.key({ type: "infinite" }) }),
    queryClient.invalidateQueries({ queryKey: orpc.post.getPost.key() }),
  ]);

/** For a like, whose response already carries the post's new state: stale, not
    refetched, because refetching an infinite query walks every loaded page in
    series, one round trip per page. */
export const markPostContentStale = async () =>
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: orpc.post.getFeed.key({ type: "infinite" }),
      refetchType: "none",
    }),
    queryClient.invalidateQueries({ queryKey: orpc.post.getPost.key(), refetchType: "none" }),
  ]);

export const refreshProfileData = async () =>
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: orpc.post.getPostsByUser.key() }),
    queryClient.invalidateQueries({ queryKey: orpc.user.getUser.key() }),
    queryClient.invalidateQueries({ queryKey: orpc.user.getUserStats.key() }),
  ]);

/** Blocking or unblocking changes both the viewer's block inventory and which
    letters the feed is allowed to show them. Refresh both, or an unblocked author
    stays invisible until the app is restarted. */
export const refreshBlocks = async () =>
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: orpc.block.listBlocks.key() }),
    refreshPostContent(),
  ]);

export const refreshAfterPostCreated = async () =>
  await Promise.all([
    refreshWorkspaceIdentityIfAnonymous(),
    refreshPostContent(),
    refreshProfileData(),
  ]);

/** A reply read or received changes both the list and the tab badge. */
export const refreshNotifications = async () =>
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: orpc.notification.list.key({ type: "infinite" }),
    }),
    queryClient.invalidateQueries({ queryKey: orpc.notification.unreadCount.key() }),
  ]);
