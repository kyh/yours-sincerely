import { AppState, Platform } from "react-native";
import { createORPCClient, onError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { SimpleCsrfProtectionLinkPlugin } from "@orpc/client/plugins";
import { StandardRPCJsonSerializer } from "@orpc/client/standard";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { focusManager, hashKey, QueryClient } from "@tanstack/react-query";

import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "@repo/api";

import { fetchWithSession } from "./api-fetch";
import { getBaseUrl } from "./base-url";

const serializer = new StandardRPCJsonSerializer();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Inputs can contain non-JSON values, so keys hash through the same
      // serializer the data does; sorting the meta keeps key order and rich
      // values from producing distinct hashes. Same canonicalization as
      // apps/web/src/orpc/query-client.ts.
      queryKeyHashFn: (queryKey) => {
        const [json, meta] = serializer.serialize(queryKey);
        return hashKey([json, meta.map(hashKey).toSorted()]);
      },
      staleTime: 30 * 1000,
    },
  },
});

// RN has no window focus events — drive refetch-on-focus from AppState so
// long-mounted tab screens refresh when the app returns to the foreground.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (status) => {
    focusManager.setFocused(status === "active");
  });
}

// RPCLink buffers each response, so the session `Set-Cookie` header stays
// visible to `fetchWithSession`'s cookie jar — a streaming transport would
// deliver the body before the wrapper could read it.
const link = new RPCLink({
  url: `${getBaseUrl()}/api/orpc`,
  fetch: fetchWithSession,
  plugins: [new SimpleCsrfProtectionLinkPlugin()],
  headers: () => ({ "x-orpc-source": "expo" }),
  interceptors: [
    onError((error) => {
      if (__DEV__) console.error(error);
    }),
  ],
});

const client: RouterClient<AppRouter> = createORPCClient(link);

/**
 * Typesafe query/mutation option builders — use with TanStack Query hooks:
 * `useQuery(orpc.post.getFeed.queryOptions({ input: { limit: 5 } }))`.
 */
export const orpc = createTanstackQueryUtils(client);

export type { RouterOutputs } from "@repo/api";
