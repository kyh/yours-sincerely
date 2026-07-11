"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/react";

/** `onUserTokenExpiring` handler for Knock providers — fetches a fresh
    user token past the server's reuse window. */
export const useKnockTokenRefresh = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useCallback(async () => {
    const { token } = await queryClient.fetchQuery({
      ...trpc.auth.knockUserToken.queryOptions(),
      staleTime: 0,
    });
    return token ?? undefined;
  }, [queryClient, trpc.auth.knockUserToken]);
};
