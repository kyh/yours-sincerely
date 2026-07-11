import * as Sentry from "@sentry/react-native";
import { useEffect } from "react";

import { useWorkspaceUser } from "@/lib/use-workspace-user";

/** Associates errors with an opaque account ID. Never sends profile data. */
export const SentryUser = () => {
  const { user } = useWorkspaceUser();

  useEffect(() => {
    Sentry.setUser(user === null ? null : { id: user.id });
  }, [user]);

  return null;
};
