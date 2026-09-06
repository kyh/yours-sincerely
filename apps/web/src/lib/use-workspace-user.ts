"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { orpc } from "@/orpc/react";

export const useWorkspaceUser = () => {
  const { data } = useSuspenseQuery(orpc.auth.workspace.queryOptions());
  return data.user;
};
