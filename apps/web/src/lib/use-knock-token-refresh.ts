"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { orpc } from "@/orpc/react";

/** `onUserTokenExpiring` handler for Knock providers — fetches a fresh
    user token past the server's reuse window. */
export const useKnockTokenRefresh = () => {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    const { token } = await queryClient.fetchQuery({
      ...orpc.auth.knockUserToken.queryOptions(),
      staleTime: 0,
    });
    return token ?? undefined;
  }, [queryClient]);
};
