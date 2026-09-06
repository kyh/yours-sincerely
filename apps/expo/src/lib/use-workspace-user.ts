import { useQuery } from "@tanstack/react-query";

import { orpc } from "./api";

/** Current user (null when browsing anonymously) — mirrors
    apps/web/src/lib/use-workspace-user.ts. Read-only: session side effects
    live in `components/session-reconciler.tsx`, mounted once. */
export const useWorkspaceUser = () => {
  const { data, isPending } = useQuery(orpc.auth.workspace.queryOptions());

  return {
    user: data?.user ?? null,
    pushCleanupCapability: data?.pushCleanupCapability ?? null,
    isPending,
  };
};
