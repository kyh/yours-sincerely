import { type } from "@orpc/contract";

import { protectedBase, publicBase } from "../base.ts";
import { registerPushTokenInput, unregisterPushTokenInput } from "./push-schema.ts";

export const pushContract = {
  register: protectedBase.input(registerPushTokenInput).output(type<{ success: boolean }>()),
  unregister: publicBase.input(unregisterPushTokenInput).output(type<{ success: boolean }>()),
};
