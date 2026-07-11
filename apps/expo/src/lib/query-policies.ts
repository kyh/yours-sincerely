import { queryClient, trpc } from "./api";

export const refreshWorkspaceIdentity = () =>
  queryClient.invalidateQueries(trpc.auth.workspace.queryFilter());

/** Content mutations (like/flag/post) only change identity when they mint the
    anonymous user — skip the workspace roundtrip once a user exists. */
export const refreshWorkspaceIdentityIfAnonymous = () => {
  const workspace = queryClient.getQueryData(trpc.auth.workspace.queryKey());
  return workspace === undefined || workspace.user === null
    ? refreshWorkspaceIdentity()
    : Promise.resolve();
};

export const refreshPostContent = () =>
  Promise.all([
    queryClient.invalidateQueries(trpc.post.getFeed.infiniteQueryFilter()),
    queryClient.invalidateQueries(trpc.post.getPost.queryFilter()),
  ]);

export const refreshProfileData = () =>
  Promise.all([
    queryClient.invalidateQueries(trpc.post.getPostsByUser.queryFilter()),
    queryClient.invalidateQueries(trpc.user.getUser.queryFilter()),
    queryClient.invalidateQueries(trpc.user.getUserStats.queryFilter()),
  ]);

export const refreshAfterPostCreated = () =>
  Promise.all([refreshWorkspaceIdentityIfAnonymous(), refreshPostContent(), refreshProfileData()]);
