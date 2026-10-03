import { oc, type } from "@orpc/contract";

import { registerPushTokenInput, unregisterPushTokenInput } from "./notifications.ts";

export const pushContract = {
  register: oc.input(registerPushTokenInput).output(type<{ success: boolean }>()),
  unregister: oc.input(unregisterPushTokenInput).output(type<{ success: boolean }>()),
};
