import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/lib/api";
import { finalizeLegacySessionMigration } from "@/lib/legacy-session-migration";
import { ignoreRejection } from "@/lib/ignore-rejection";

/** Reconciles the stored session with what the server says, once per
    workspace result. Mounted a single time at the root so the side effects
    run once per result instead of once per `useWorkspaceUser` caller. */
export const SessionReconciler = () => {
  const { data } = useQuery(orpc.auth.workspace.queryOptions());

  useEffect(() => {
    if (data === undefined) {
      return;
    }
    if (data.user !== null) {
      void ignoreRejection(finalizeLegacySessionMigration(true));
    }
    // A null result can predate a newly issued cookie. It changes the query's
    // signed-in state, but only explicit sign-out may delete the stored session.
  }, [data]);

  return null;
};
