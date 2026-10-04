import { type } from "@orpc/contract";

import {
  requestPasswordResetInput,
  setPasswordInput,
  signInWithPasswordInput,
  signUpInput,
} from "../auth.ts";
import { protectedBase, publicBase } from "../base.ts";

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
  requestPasswordReset: publicBase
    .input(requestPasswordResetInput)
    .output(type<{ success: boolean }>()),
  setPassword: publicBase.input(setPasswordInput).output(type<{ success: boolean }>()),
  signInWithPassword: publicBase.input(signInWithPasswordInput).output(type<{ user: Viewer }>()),
  signOut: protectedBase.output(type<{ user: null }>()),
  signOutEverywhere: protectedBase.output(type<{ user: null }>()),
  signUp: publicBase.input(signUpInput).output(type<{ user: Viewer }>()),
  workspace: publicBase.output(
    type<{
      /** Lets a device unregister its push token after sign-out; see
          `packages/service/src/auth/push-cleanup-capability.ts`. */
      pushCleanupCapability: string | null;
      user: Viewer | null;
    }>(),
  ),
};
