import { StandardRPCJsonSerializer } from "@orpc/client/standard";
import { defaultShouldDehydrateQuery, hashKey, QueryClient } from "@tanstack/react-query";

// oRPC's own serializer, so dehydrated data round-trips every type the RPC
// protocol supports (Date, Map, Set, BigInt, URL, RegExp).
const serializer = new StandardRPCJsonSerializer();

export const createQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Inputs can contain non-JSON values, so keys have to hash through the
        // same serializer the data does. Two canonicalizations are needed, not
        // one: `hashKey` sorts object keys but leaves array order alone, and the
        // serializer emits one meta entry per rich value in traversal order. Sort
        // the meta too, or `{ from: Date, to: Date }` and `{ to: Date, from: Date }`
        // hash differently and each gets its own cache entry. The default sort is
        // code-unit order — `localeCompare` would let a server and a browser on
        // different locales disagree, and hydration would miss the server's key.
        queryKeyHashFn: (queryKey) => {
          const [json, meta] = serializer.serialize(queryKey);
          return hashKey([json, meta.map(hashKey).toSorted()]);
        },
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
      },
      // No `mutations.onSuccess` default here on purpose. TanStack merges
      // mutation options by spread, so a per-mutation `onSuccess` replaces the
      // default rather than chaining with it — a blanket default silently does
      // nothing for every mutation that defines its own. Each mutation calls an
      // explicit policy from `@/lib/query-policies` instead.
      dehydrate: {
        serializeData: (data) => {
          const [json, meta] = serializer.serialize(data);
          return { json, meta };
        },
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
        shouldRedactErrors: () => {
          // We should not catch Next.js server errors
          // as that's how Next.js detects dynamic pages
          // so we cannot redact them.
          // Next.js also automatically redacts errors for us
          // with better digests.
          return false;
        },
      },
      hydrate: {
        deserializeData: (data) => serializer.deserialize(data.json, data.meta),
      },
    },
  });

  return queryClient;
};
