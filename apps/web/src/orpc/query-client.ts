import { ORPCError, RPCSerializer } from "@orpc/client";
import { isPermanentErrorCode, MAX_QUERY_RETRIES } from "@repo/contract/client/query-retry";
import {
  defaultShouldDehydrateQuery,
  environmentManager,
  QueryClient,
} from "@tanstack/react-query";

const serializer = new RPCSerializer();

export const createQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      dehydrate: {
        serializeData: (data) => serializer.serialize(data, { useFormDataForBlobFields: false }),
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
        shouldRedactErrors: () => false,
      },
      hydrate: {
        deserializeData: (data) => serializer.deserialize(data),
      },
      queries: {
        retry: (failureCount, error) =>
          !environmentManager.isServer() &&
          failureCount < MAX_QUERY_RETRIES &&
          !(error instanceof ORPCError && isPermanentErrorCode(error.code)),
        staleTime: 30 * 1000,
      },
    },
  });

  return queryClient;
};
