import { oc, type } from "@orpc/contract";

export const promptContract = {
  getRandomPrompt: oc.output(type<string>()),
};
