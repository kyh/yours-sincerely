import { ORPCError } from "@orpc/client";
import { isPermanentErrorCode, MAX_QUERY_RETRIES } from "@repo/contract/client/query-retry";

const isORPCError = (error: Error): error is ORPCError<string, unknown> =>
  error instanceof ORPCError;

/** Query `retry`: network and server failures keep TanStack's retries. */
export const shouldRetryQuery = (failureCount: number, error: Error) =>
  !(isORPCError(error) && isPermanentErrorCode(error.code)) && failureCount < MAX_QUERY_RETRIES;
