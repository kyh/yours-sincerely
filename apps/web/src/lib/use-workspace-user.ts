"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/react";

export const useWorkspace = () => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.auth.workspace.queryOptions());
  return data;
};

export const useWorkspaceUser = () => useWorkspace().user;
