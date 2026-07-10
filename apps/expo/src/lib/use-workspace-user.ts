import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "./api";
import { deleteSessionCookie, getSessionCookie } from "./session-store";

/** Current user (null when browsing anonymously) — mirrors
    apps/web/src/lib/use-workspace-user.ts. */
export const useWorkspaceUser = () => {
  const { data, isPending } = useQuery(trpc.auth.workspace.queryOptions());
  const user = data?.user ?? null;

  // A stored cookie that no longer resolves to a user is dead (account
  // deleted elsewhere, or signature rejected) — drop it so the app settles
  // into a clean signed-out state instead of replaying it forever.
  useEffect(() => {
    if (data !== undefined && data.user === null && getSessionCookie() !== null) {
      deleteSessionCookie().catch(() => undefined);
    }
  }, [data]);

  return { user, isPending };
};
