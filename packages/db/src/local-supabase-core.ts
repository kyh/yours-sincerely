/** The pure half of `pnpm db:start` (`local-supabase.ts`): reading the database URL
    out of the CLI's status, and deciding what `.env` should say about it. */

import { parseEnv } from "node:util";

/** `supabase status --env --output-format text` prints the stack's variables as dotenv
    lines. The explicit format matters: left to itself, the CLI prints JSON instead
    whenever it decides an agent is asking. */
export const parseDbUrl = (statusEnv: string): string => {
  const dbUrl = parseEnv(statusEnv).DB_URL;
  if (!dbUrl) {
    throw new Error("supabase status reported no DB_URL");
  }
  return dbUrl;
};

/** A URL whose host is this machine. Only such a POSTGRES_URL is ours to repoint: one
    naming any other host is a database someone chose on purpose. */
export const isLoopbackUrl = (url: string): boolean => {
  try {
    return ["127.0.0.1", "localhost", "[::1]"].includes(new URL(url).hostname);
  } catch {
    return false;
  }
};

/** Sets `key` in dotenv text: the first assignment is rewritten in place and any later
    one dropped (dotenv's last assignment wins, so a stale duplicate would win), or one
    is appended when there is none. Every other line is left byte-identical. */
export const withEnvVar = (envText: string, key: string, value: string): string => {
  const assignment = new RegExp(String.raw`^[ \t]*(?:export[ \t]+)?${key}[ \t]*=.*(?:\n|$)`, "gmu");
  const line = `${key}="${value}"`;
  let replaced = false;
  const text = envText.replace(assignment, (match) => {
    if (replaced) {
      return "";
    }
    replaced = true;
    return match.endsWith("\n") ? `${line}\n` : line;
  });
  if (replaced) {
    return text;
  }
  const separator = text === "" || text.endsWith("\n") ? "" : "\n";
  return `${text}${separator}${line}\n`;
};

export type EnvUpdate =
  | { kind: "unchanged" }
  | { kind: "kept-remote" }
  | { kind: "write"; text: string };

/** What `.env` should become now that this checkout's local database is at `dbUrl`. */
export const planEnvUpdate = (envText: string, dbUrl: string): EnvUpdate => {
  const current = parseEnv(envText).POSTGRES_URL;
  if (current === dbUrl) {
    return { kind: "unchanged" };
  }
  if (current && !isLoopbackUrl(current)) {
    return { kind: "kept-remote" };
  }
  return { kind: "write", text: withEnvVar(envText, "POSTGRES_URL", dbUrl) };
};
