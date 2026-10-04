import { os } from "../orpc";
import { getTodaysPrompt } from "./prompt-data";

export const promptRouter = {
  getRandomPrompt: os.prompt.getRandomPrompt.handler(() => {
    const todaysPrompt = getTodaysPrompt();
    return todaysPrompt?.content ?? "Write a love letter to your future self";
  }),
};
