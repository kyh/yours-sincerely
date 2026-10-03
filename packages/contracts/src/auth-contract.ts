import { oc, type } from "@orpc/contract";

import {
  requestPasswordResetInput,
  setPasswordInput,
  signInWithPasswordInput,
  signUpInput,
} from "./auth.ts";

/** What a client is told about its own account. `role` and `sessionEpoch` live
    on the server's session user and never reach the wire. */
export interface Viewer {
  disabled: boolean | null;
  displayImage: string | null;
  displayName: string | null;
  email: string | null;
  id: string;
}

export const authContract = {
  requestPasswordReset: oc.input(requestPasswordResetInput).output(type<{ success: boolean }>()),
  setPassword: oc.input(setPasswordInput).output(type<{ success: boolean }>()),
  signInWithPassword: oc.input(signInWithPasswordInput).output(type<{ user: Viewer }>()),
  signOut: oc.output(type<{ user: null }>()),
  signOutEverywhere: oc.output(type<{ user: null }>()),
  signUp: oc.input(signUpInput).output(type<{ user: Viewer }>()),
  workspace: oc.output(
    type<{
      /** Lets a device unregister its push token after sign-out; see
          `packages/api/src/auth/push-cleanup-capability.ts`. */
      pushCleanupCapability: string | null;
      user: Viewer | null;
    }>(),
  ),
};
