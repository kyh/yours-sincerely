import type { ORPCContext } from "../orpc";
import { promptContract } from "@repo/contracts/prompt-contract";
import { implement } from "@orpc/server";

import { getTodaysPrompt } from "./prompt-data";

const os = implement(promptContract).$context<ORPCContext>();

export const promptRouter = os.router({
  getRandomPrompt: os.getRandomPrompt.handler(() => {
    const todaysPrompt = getTodaysPrompt();
    return todaysPrompt?.content ?? "Write a love letter to your future self";
  }),
});
