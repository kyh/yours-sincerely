import assert from "node:assert/strict";
import { getEventListeners, once } from "node:events";
import { registerHooks } from "node:module";
import { it } from "node:test";
import { createORPCClient } from "@orpc/client";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryClient, QueryObserver } from "@tanstack/react-query";

import type { ContractClient } from "@repo/contract";
import { inSequence } from "@repo/contract/in-sequence";

interface Workspace {
  userId: string | null;
}

interface Feed {
  viewerId: string | null;
  liked: boolean;
}

it("updates retained tab observers and drops inactive account data on account change and signout", async (t) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false, staleTime: Infinity } },
  });

  const client: ContractClient = createORPCClient({
    call: async () => await Promise.reject(new Error("No network in unit tests")),
  });

  const orpc = createTanstackQueryUtils(client);
  const apiModule = new URL("api.tsx", import.meta.url).href;

  const imports = registerHooks({
    load: (url, context, nextLoad) =>
      url === apiModule || url.startsWith(`${apiModule}?`)
        ? { format: "module", shortCircuit: true, source: "" }
        : nextLoad(url, context),
    resolve: (specifier, context, nextResolve) =>
      nextResolve(specifier === "./api" ? "./api.tsx" : specifier, context),
  });

  t.after(() => {
    imports.deregister();
  });
  t.mock.module("./api", { exports: { orpc, queryClient } });
  const { resetAfterSessionChanged } = await import("./query-policies.ts");

  const workspaceKey = orpc.auth.workspace.key();
  const feedKey = orpc.post.getFeed.key();
  const inactiveKey = orpc.notification.list.key();
  const unreadCountKey = orpc.notification.unreadCount.queryKey();
  const blocksKey = orpc.block.listBlocks.queryKey();
  const oldWorkspace: Workspace = { userId: "account-a" };
  const oldFeed: Feed = { liked: true, viewerId: "account-a" };
  queryClient.setQueryData(workspaceKey, oldWorkspace);
  queryClient.setQueryData(feedKey, oldFeed);

  const workspaceAnswered = new EventTarget();
  const feedAnswered = new EventTarget();
  let workspaceAnswer = oldWorkspace;
  let feedAnswer = oldFeed;

  const workspace = new QueryObserver(queryClient, {
    queryFn: async () => {
      await once(workspaceAnswered, "answer");

      return workspaceAnswer;
    },
    queryKey: workspaceKey,
  });

  const feed = new QueryObserver(queryClient, {
    queryFn: async () => {
      await once(feedAnswered, "answer");

      return feedAnswer;
    },
    queryKey: feedKey,
  });

  const workspaceUpdates: (Workspace | undefined)[] = [];
  const feedUpdates: (Feed | undefined)[] = [];

  const unsubscribeWorkspace = workspace.subscribe((result) => {
    workspaceUpdates.push(result.data);
  });

  const unsubscribeFeed = feed.subscribe((result) => {
    feedUpdates.push(result.data);
  });

  t.after(() => {
    unsubscribeWorkspace();
    unsubscribeFeed();
    queryClient.clear();
  });
  assert.deepEqual(workspace.getCurrentResult().data, oldWorkspace);
  assert.deepEqual(feed.getCurrentResult().data, oldFeed);

  await inSequence(["account-b", null], async (userId) => {
    queryClient.setQueryData(inactiveKey, [{ message: "Previous account's notification" }]);
    workspaceUpdates.length = 0;
    feedUpdates.length = 0;

    let protectedRequests = 0;
    queryClient.setQueryData(unreadCountKey, { count: 3 });
    queryClient.setQueryData(blocksKey, { blocks: [] });

    const unsubscribeProtected = [
      new QueryObserver(queryClient, {
        queryFn: () => {
          protectedRequests += 1;

          return { count: 0 };
        },
        queryKey: unreadCountKey,
      }).subscribe(() => {}),
      new QueryObserver(queryClient, {
        queryFn: () => {
          protectedRequests += 1;

          return { blocks: [] };
        },
        queryKey: blocksKey,
      }).subscribe(() => {}),
    ];

    const changed = resetAfterSessionChanged();

    assert.equal(workspace.getCurrentResult().data, undefined);
    assert.equal(feed.getCurrentResult().data, undefined);
    assert.ok(workspaceUpdates.length > 0);
    assert.ok(feedUpdates.length > 0);
    assert.ok(workspaceUpdates.every((data) => data === undefined));
    assert.ok(feedUpdates.every((data) => data === undefined));
    assert.equal(queryClient.getQueryData(inactiveKey), undefined);
    assert.equal(queryClient.getQueryData(unreadCountKey), undefined);
    assert.equal(queryClient.getQueryData(blocksKey), undefined);

    const nextWorkspace: Workspace = { userId };
    const nextFeed: Feed = { liked: false, viewerId: userId };
    assert.equal(getEventListeners(workspaceAnswered, "answer").length, 1);
    assert.equal(getEventListeners(feedAnswered, "answer").length, 1);
    workspaceAnswer = nextWorkspace;
    feedAnswer = nextFeed;
    workspaceAnswered.dispatchEvent(new Event("answer"));
    feedAnswered.dispatchEvent(new Event("answer"));
    await changed;

    assert.deepEqual(workspaceUpdates.slice(-1), [nextWorkspace]);
    assert.deepEqual(feedUpdates.slice(-1), [nextFeed]);
    assert.deepEqual(workspace.getCurrentResult().data, nextWorkspace);
    assert.deepEqual(feed.getCurrentResult().data, nextFeed);
    assert.equal(queryClient.getQueryData(inactiveKey), undefined);
    assert.equal(protectedRequests, 0);

    for (const unsubscribe of unsubscribeProtected) {
      unsubscribe();
    }
  });
});
