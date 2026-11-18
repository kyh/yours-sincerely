import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { it } from "node:test";
import { createORPCClient } from "@orpc/client";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryClient, QueryObserver } from "@tanstack/react-query";

import type { ContractClient } from "@repo/contract";

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
    call: () => Promise.reject(new Error("No network in unit tests")),
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

  t.after(() => imports.deregister());
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

  const workspaceRequests: ((value: Workspace) => void)[] = [];
  const feedRequests: ((value: Feed) => void)[] = [];

  const workspace = new QueryObserver(queryClient, {
    queryFn: () =>
      // oxlint-disable-next-line promise/avoid-new -- Keep the new session response pending while checking stale-data removal.
      new Promise<Workspace>((resolve) => {
        workspaceRequests.push(resolve);
      }),
    queryKey: workspaceKey,
  });

  const feed = new QueryObserver(queryClient, {
    queryFn: () =>
      // oxlint-disable-next-line promise/avoid-new -- Retained feed observers must drop old personalized data before this response.
      new Promise<Feed>((resolve) => {
        feedRequests.push(resolve);
      }),
    queryKey: feedKey,
  });

  const workspaceUpdates: (Workspace | undefined)[] = [];
  const feedUpdates: (Feed | undefined)[] = [];
  const unsubscribeWorkspace = workspace.subscribe((result) => workspaceUpdates.push(result.data));
  const unsubscribeFeed = feed.subscribe((result) => feedUpdates.push(result.data));
  t.after(() => {
    unsubscribeWorkspace();
    unsubscribeFeed();
    queryClient.clear();
  });
  assert.deepEqual(workspace.getCurrentResult().data, oldWorkspace);
  assert.deepEqual(feed.getCurrentResult().data, oldFeed);

  for (const userId of ["account-b", null]) {
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
    assert.equal(workspaceRequests.length, 1);
    assert.equal(feedRequests.length, 1);
    const respondWorkspace = workspaceRequests.shift();
    const respondFeed = feedRequests.shift();
    assert.ok(respondWorkspace);
    assert.ok(respondFeed);
    respondWorkspace(nextWorkspace);
    respondFeed(nextFeed);
    await changed;

    assert.deepEqual(workspaceUpdates.at(-1), nextWorkspace);
    assert.deepEqual(feedUpdates.at(-1), nextFeed);
    assert.deepEqual(workspace.getCurrentResult().data, nextWorkspace);
    assert.deepEqual(feed.getCurrentResult().data, nextFeed);
    assert.equal(queryClient.getQueryData(inactiveKey), undefined);
    assert.equal(protectedRequests, 0);

    for (const unsubscribe of unsubscribeProtected) {
      unsubscribe();
    }
  }
});
