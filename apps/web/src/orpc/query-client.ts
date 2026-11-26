import { ORPCError, RPCSerializer } from "@orpc/client";
import { isPermanentErrorCode, MAX_QUERY_RETRIES } from "@repo/contract/client/query-retry";
import {
  defaultShouldDehydrateQuery,
  environmentManager,
  QueryClient,
} from "@tanstack/react-query";

const isORPCError = (error: Error): error is ORPCError<string, unknown> =>
  error instanceof ORPCError;

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
          !(isORPCError(error) && isPermanentErrorCode(error.code)),
        staleTime: 30 * 1000,
      },
    },
  });

  return queryClient;
};
