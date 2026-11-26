import assert from "node:assert/strict";
import { getEventListeners, once } from "node:events";
import test from "node:test";
import { QueryClient, QueryObserver } from "@tanstack/react-query";

import { orpc } from "@/orpc/react";
import { refreshAfterPostDeleted, resetAfterSessionChanged } from "./query-policies";

interface Viewer {
  userId: string;
}

test("a session change drops the old identity's cache without blanking mounted queries", async (t) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false, staleTime: Infinity } },
  });

  t.after(() => {
    queryClient.clear();
  });

  const blocksKey = orpc.block.listBlocks.queryKey();
  queryClient.setQueryData(blocksKey, { blocks: [] });

  const viewerKey = ["viewer"];
  const oldViewer: Viewer = { userId: "account-a" };
  queryClient.setQueryData(viewerKey, oldViewer);
  const viewerAnswered = new EventTarget();
  let viewerAnswer = oldViewer;

  const viewer = new QueryObserver(queryClient, {
    queryFn: async () => {
      await once(viewerAnswered, "answer");

      return viewerAnswer;
    },
    queryKey: viewerKey,
  });

  t.after(viewer.subscribe(() => {}));

  const unreadKey = orpc.notification.unreadCount.queryKey();
  queryClient.setQueryData(unreadKey, { count: 3 });
  let unreadRequests = 0;

  const unread = new QueryObserver(queryClient, {
    queryFn: () => {
      unreadRequests += 1;

      return { count: 0 };
    },
    queryKey: unreadKey,
  });

  t.after(unread.subscribe(() => {}));

  queryClient.getMutationCache().build(queryClient, { mutationKey: ["user", "updateUser"] });

  const changed = resetAfterSessionChanged(queryClient);

  assert.equal(queryClient.getQueryData(blocksKey), undefined);
  assert.equal(queryClient.getMutationCache().getAll().length, 0);
  assert.equal(queryClient.getQueryData(unreadKey), undefined);
  assert.deepEqual(viewer.getCurrentResult().data, oldViewer);
  assert.equal(viewer.getCurrentResult().isFetching, true);

  assert.equal(getEventListeners(viewerAnswered, "answer").length, 1);
  const newViewer: Viewer = { userId: "account-b" };
  viewerAnswer = newViewer;
  viewerAnswered.dispatchEvent(new Event("answer"));
  await changed;

  assert.deepEqual(viewer.getCurrentResult().data, newViewer);
  assert.equal(unreadRequests, 0);
});

test("deleting a post refetches every mounted post but the deleted one", async (t) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false, staleTime: Infinity } },
  });

  t.after(() => {
    queryClient.clear();
  });

  const requests: string[] = [];

  const observePost = (postId: string) => {
    const queryKey = [...orpc.post.getPost.queryKey({ input: { postId } })];
    queryClient.setQueryData(queryKey, { postId });

    const observer = new QueryObserver(queryClient, {
      queryFn: () => {
        requests.push(postId);

        return { postId };
      },
      queryKey,
    });

    t.after(observer.subscribe(() => {}));

    return queryKey;
  };

  const deletedKey = observePost("deleted");
  observePost("parent");

  await refreshAfterPostDeleted(queryClient, "deleted");

  assert.deepEqual(requests, ["parent"]);
  assert.equal(queryClient.getQueryState(deletedKey)?.isInvalidated, true);
});
