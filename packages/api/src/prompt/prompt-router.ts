import { createTRPCRouter, publicProcedure } from "../trpc";
import { getTodaysPrompt } from "./prompt-data";

export const promptRouter = createTRPCRouter({
  getRandomPrompt: publicProcedure.query(() => {
    const todaysPrompt = getTodaysPrompt();
    return todaysPrompt?.content ?? "Write a love letter to your future self";
  }),
});
