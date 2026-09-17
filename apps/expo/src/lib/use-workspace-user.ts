import { useQuery } from "@tanstack/react-query";

import { orpc } from "./api";

/** Current user (null when browsing anonymously) — mirrors
    apps/web/src/lib/use-workspace-user.ts. Read-only: session side effects
    live in `components/session-reconciler.tsx`, mounted once. */
export const useWorkspaceUser = () => {
  const { data, isError, isPending, refetch } = useQuery(orpc.auth.workspace.queryOptions());

  return {
    isError,
    isPending,
    pushCleanupCapability: data?.pushCleanupCapability ?? null,
    refetch,
    user: data?.user ?? null,
  };
};
