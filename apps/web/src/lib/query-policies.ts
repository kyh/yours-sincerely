import { hashKey } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { orpc } from "@/orpc/react";

/** Sign-in, sign-up, sign-out and password reset: nearly every cached answer
    (isLiked, block filtering, the block list, the inbox) belonged to the old
    identity, and no query key names it. Expo uses `resetQueries`; web does not,
    because it would put mounted suspense queries back to pending and swap the
    page for its loading fallback. Inactive entries are dropped instead, and
    mounted ones refetch behind the data they already show. */
export const resetAfterSessionChanged = async (queryClient: QueryClient) => {
  queryClient.getMutationCache().clear();
  queryClient.removeQueries({ queryKey: orpc.notification.key() });
  queryClient.removeQueries({ queryKey: orpc.block.listBlocks.key() });
  queryClient.removeQueries({ type: "inactive" });
  await queryClient.invalidateQueries();
};

export const refreshWorkspaceIdentity = async (queryClient: QueryClient) => {
  await queryClient.invalidateQueries({ queryKey: orpc.auth.workspace.key() });
  queryClient.removeQueries({ queryKey: orpc.notification.key() });
};

/** Content mutations (like/flag/post) only change identity when they mint the
    anonymous user — skip the workspace roundtrip once a user exists. */
export const refreshWorkspaceIdentityIfAnonymous = (queryClient: QueryClient) => {
  const workspace = queryClient.getQueryData(orpc.auth.workspace.queryKey());

  return workspace === undefined || workspace.user === null
    ? refreshWorkspaceIdentity(queryClient)
    : Promise.resolve();
};

export const refreshPostContent = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: orpc.post.getFeed.key({ type: "infinite" }) }),
    queryClient.invalidateQueries({ queryKey: orpc.post.getPost.key() }),
  ]);

/** For a like, whose response already carries the post's new state: stale, not
    refetched, because refetching an infinite query walks every loaded page in
    series, one round trip per page. */
export const markPostContentStale = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({
      queryKey: orpc.post.getFeed.key({ type: "infinite" }),
      refetchType: "none",
    }),
    queryClient.invalidateQueries({ queryKey: orpc.post.getPost.key(), refetchType: "none" }),
  ]);

export const refreshProfileData = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: orpc.post.getPostsByUser.key() }),
    queryClient.invalidateQueries({ queryKey: orpc.user.getUser.key() }),
    queryClient.invalidateQueries({ queryKey: orpc.user.getUserStats.key() }),
  ]);

/** The letter leaves the feed and its author's profile counts change. Its own
    query is only marked stale: the permalink is still mounted while it
    navigates away, and a refetch there can only answer NOT_FOUND. */
export const refreshAfterPostDeleted = async (queryClient: QueryClient, postId: string) => {
  const deletedPost = orpc.post.getPost.queryKey({ input: { postId } });
  const deletedPostHash = hashKey(deletedPost);
  await queryClient.cancelQueries({ exact: true, queryKey: deletedPost });
  await Promise.all([
    queryClient.invalidateQueries({ exact: true, queryKey: deletedPost, refetchType: "none" }),
    queryClient.invalidateQueries({ queryKey: orpc.post.getFeed.key({ type: "infinite" }) }),
    queryClient.invalidateQueries({
      predicate: (query) => query.queryHash !== deletedPostHash,
      queryKey: orpc.post.getPost.key(),
    }),
    refreshProfileData(queryClient),
  ]);
};

/** Blocking or unblocking changes both the viewer's block inventory and which
    letters the feed is allowed to show them. Refresh both, or an unblocked author
    stays invisible until a hard reload. */
export const refreshBlocks = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: orpc.block.listBlocks.key() }),
    refreshPostContent(queryClient),
  ]);

/** Reading changes the row and the sidebar badge together. */
export const refreshNotifications = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({
      queryKey: orpc.notification.list.key({ type: "infinite" }),
    }),
    queryClient.invalidateQueries({ queryKey: orpc.notification.unreadCount.key() }),
  ]);

export const refreshAfterPostCreated = (queryClient: QueryClient) =>
  Promise.all([
    refreshWorkspaceIdentityIfAnonymous(queryClient),
    refreshPostContent(queryClient),
    refreshProfileData(queryClient),
  ]);
