import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");

const DIM = "\u001B[2m";
const CYAN = "\u001B[36m";
const GREEN = "\u001B[32m";
const RESET = "\u001B[0m";

const exec = (cmd: string) => {
  if (DRY_RUN) {
    console.log(`  [dry-run] exec: ${cmd}`);

    return;
  }

  execSync(cmd, { cwd: ROOT_DIR, stdio: "inherit" });
};

const commandExists = (cmd: string) => {
  try {
    execSync(`command -v ${cmd}`, { cwd: ROOT_DIR, stdio: "ignore" });

    return true;
  } catch {
    return false;
  }
};

const envFile = (name: string) => path.resolve(ROOT_DIR, name);

const createEnv = () => {
  if (fs.existsSync(envFile(".env"))) {
    console.log("  ✓ .env already exists, skipping");

    return;
  }

  if (DRY_RUN) {
    console.log("  [dry-run] copy .env.example to .env");

    return;
  }

  fs.copyFileSync(envFile(".env.example"), envFile(".env"));
  console.log("  ✓ .env created from .env.example");
};

const startPostgres = () => {
  console.log("\nStarting local Supabase...");

  try {
    exec("pnpm db:start");
  } catch (error) {
    console.log(
      `\n  ${DIM}✗ Local Supabase didn't start.${RESET} Its native runtime needs macOS 14+ on ` +
        "Apple silicon or Linux (glibc 2.35+). As root, Postgres needs another user: set " +
        "SUPABASE_NATIVE_POSTGRES_USER (the CLI's message above says how), then re-run " +
        "`pnpm bootstrap`.",
    );
    throw error;
  }

  console.log("  ✓ Postgres ready, its URL in .env.local");
};

const pushSchema = () => {
  console.log("\nPushing database schema...");
  exec("pnpm db:push");
  console.log("  ✓ Schema pushed");
};

const runSeed = () => {
  console.log("\nSeeding database...");

  try {
    exec("pnpm db:seed");
  } catch (error) {
    console.log(
      `\n  ${DIM}✗ Seeding failed.${RESET} If the local database has a leftover or conflicting ` +
        "schema, run `pnpm db:reset` to rebuild it, then re-run `pnpm bootstrap`.",
    );
    throw error;
  }

  console.log("  ✓ Performance fixture in place (no signable accounts)");
};

const checkAgentTooling = () => {
  console.log("\nAgent tooling...");

  if (commandExists("agent-browser")) {
    console.log("  ✓ agent-browser found");

    return;
  }

  console.log(
    `  ${DIM}○ agent-browser not found${RESET} (optional: drives the web app end-to-end)`,
  );
  console.log("    Install: npm i -g agent-browser && agent-browser install");
};

const main = () => {
  console.log("\n  Setting up Yours Sincerely\n");
  console.log("Configuring environment...");
  createEnv();
  startPostgres();
  pushSchema();
  runSeed();
  checkAgentTooling();

  console.log(`\n  ${GREEN}Setup complete!${RESET}\n`);
  console.log(`  Start:  ${CYAN}pnpm dev:web${RESET}   (→ http://localhost:3000)`);
  console.log(`  Verify: ${CYAN}pnpm verify${RESET}    (typecheck · lint · format · test · build)`);
  console.log(`  Login:  none seeded; sign up at ${CYAN}/auth/sign-up${RESET} (see AGENTS.md)`);
  console.log(`  Agents: read ${CYAN}AGENTS.md${RESET}\n`);
};

try {
  main();
} catch (error: unknown) {
  console.error(error);
  process.exit(1);
}
