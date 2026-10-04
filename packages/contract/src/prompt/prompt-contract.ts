import { type } from "@orpc/contract";

import { publicBase } from "../base.ts";

export const promptContract = {
  getRandomPrompt: publicBase.output(type<string>()),
};
