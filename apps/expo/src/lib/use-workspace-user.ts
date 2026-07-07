import { useQuery } from "@tanstack/react-query";

import { trpc } from "./api";

/** Current user (null when browsing anonymously) — mirrors
    apps/web/src/lib/use-workspace-user.ts. */
export const useWorkspaceUser = () => {
  const { data, isPending } = useQuery(trpc.auth.workspace.queryOptions());
  return { user: data?.user ?? null, isPending };
};
