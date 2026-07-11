import { queryClient, trpc } from "./api";

export const refreshWorkspaceIdentity = () =>
  queryClient.invalidateQueries(trpc.auth.workspace.queryFilter());

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
  Promise.all([refreshWorkspaceIdentity(), refreshPostContent(), refreshProfileData()]);
