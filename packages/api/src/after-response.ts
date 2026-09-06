import { after } from "next/server";

/**
 * Runs `task` once the response has been sent, so the caller never waits on
 * it. Outside a Next request scope — the in-process router client the
 * integration suites use — there is no response to wait for, so the task runs
 * inline and is awaited, which keeps those tests deterministic.
 */
export const afterResponse = async (task: () => Promise<void>): Promise<void> => {
  try {
    after(task);
  } catch {
    await task();
  }
};
