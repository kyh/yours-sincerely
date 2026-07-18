import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query";
import SuperJSON from "superjson";

export const createQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
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
        serializeData: SuperJSON.serialize,
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
        deserializeData: SuperJSON.deserialize,
      },
    },
  });

  return queryClient;
};
