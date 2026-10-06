/**
 * `pnpm db:start`: brings up this checkout's local Supabase, without Docker, and points
 * `.env` at it.
 *
 * `supabase/config.toml` turns on the CLI's stack backend (`[experimental] stack`, CLI
 * 2.119+), whose native runtime runs Postgres as a plain process: no container engine,
 * on macOS 14+ (Apple silicon) and Linux (glibc 2.35+), cloud agent sandboxes included.
 * The CLI keeps one stack per checkout AND git branch, each with its own data and its
 * own ports, so worktrees and parallel agents never share a database or fight over a
 * port. That is why the config pins no port and this script writes the URL the CLI
 * picked into `.env`; a new branch starts with an EMPTY database (`pnpm db:push`).
 *
 * `--runtime native` is explicit because the CLI otherwise prefers Docker whenever a
 * daemon answers. `SUPABASE_RUNTIME=docker` picks Docker where the native runtime is
 * unsupported; a stack keeps the runtime it was created with.
 *
 * Run with: pnpm db:start   (`pnpm db:reset` runs it first, too)
 */
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { parseDbUrl, planEnvUpdate } from "./local-supabase-core";

const ROOT_DIR = path.join(import.meta.dirname, "..", "..", "..");
const ENV_PATH = path.join(ROOT_DIR, ".env");

/** Postgres's initdb refuses to run as root, and root is how cloud sandboxes and CI
    containers run. The CLI then runs Postgres as SUPABASE_NATIVE_POSTGRES_USER, and this
    is the system account its own error message suggests creating. */
const POSTGRES_USER = "supabase-postgres";

const supabaseEnv = () => {
  const env = { ...process.env };
  if (process.getuid?.() !== 0 || env.SUPABASE_NATIVE_POSTGRES_USER) {
    return env;
  }
  if (spawnSync("id", ["-u", POSTGRES_USER], { stdio: "ignore" }).status !== 0) {
    console.log(`Running as root: creating system user ${POSTGRES_USER} to run Postgres`);
    execFileSync("useradd", ["--system", "--user-group", POSTGRES_USER], { stdio: "inherit" });
  }
  env.SUPABASE_NATIVE_POSTGRES_USER = POSTGRES_USER;
  return env;
};

const main = () => {
  const env = supabaseEnv();

  /** Idempotent: a running stack answers "already running" and exits 0. */
  const start = spawnSync("supabase", ["start", "--runtime", env.SUPABASE_RUNTIME ?? "native"], {
    env,
    stdio: "inherit",
  });
  if (start.error) {
    throw start.error;
  }
  if (start.status !== 0) {
    process.exitCode = start.status ?? 1;
    return;
  }

  const dbUrl = parseDbUrl(
    execFileSync("supabase", ["status", "--env", "--output-format", "text"], {
      encoding: "utf-8",
      env,
    }),
  );

  if (!existsSync(ENV_PATH)) {
    copyFileSync(path.join(ROOT_DIR, ".env.example"), ENV_PATH);
    console.log("Created .env from .env.example");
  }

  const update = planEnvUpdate(readFileSync(ENV_PATH, "utf-8"), dbUrl);
  if (update.kind === "write") {
    writeFileSync(ENV_PATH, update.text);
    console.log(`POSTGRES_URL in .env -> ${dbUrl}`);
  } else if (update.kind === "kept-remote") {
    console.log(
      `POSTGRES_URL in .env is not on this machine, so it stays. Local database: ${dbUrl}`,
    );
  } else {
    console.log(`POSTGRES_URL in .env already names this checkout's database: ${dbUrl}`);
  }
};

main();
