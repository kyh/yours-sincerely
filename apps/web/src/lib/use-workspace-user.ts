"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { orpc } from "@/orpc/react";

export const useWorkspace = () => {
  const { data } = useSuspenseQuery(orpc.auth.workspace.queryOptions());
  return data;
};

export const useWorkspaceUser = () => useWorkspace().user;
