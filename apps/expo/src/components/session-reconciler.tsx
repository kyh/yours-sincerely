import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/lib/api";
import { finalizeLegacySessionMigration } from "@/lib/legacy-session-migration";
import { deleteSessionCookie, getSessionCookie } from "@/lib/session-store";

/** Reconciles the stored session with what the server says, once per
    workspace result. Mounted a single time at the root so the side effects
    run once per result instead of once per `useWorkspaceUser` caller. */
export const SessionReconciler = () => {
  const { data } = useQuery(orpc.auth.workspace.queryOptions());

  useEffect(() => {
    if (data === undefined) return;
    if (data.user !== null) {
      finalizeLegacySessionMigration(true).catch(() => undefined);
    } else if (getSessionCookie() !== null) {
      // A stored cookie that no longer resolves to a user is dead (account
      // deleted elsewhere, or signature rejected) — drop it so the app settles
      // into a clean signed-out state instead of replaying it forever.
      deleteSessionCookie().catch(() => undefined);
    }
  }, [data]);

  return null;
};
