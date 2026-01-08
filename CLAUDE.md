# Agent Instructions

Anonymous love letters app with disappearing ink. T3 Turbo stack + Supabase.

## Stack

- **Monorepo**: pnpm + Turborepo
- **Web**: Next.js (App Router, Turbopack), Tailwind v4, tRPC
- **Mobile**: Capacitor (iOS/Android)
- **DB**: Postgres (Supabase) + Drizzle ORM
- **Auth**: Supabase Auth
- **Notifications**: Knock
- **Hosting**: Vercel

## Structure

```
apps/
  nextjs/      # Web app (@repo/nextjs)
  capacitor/   # iOS/Android wrapper
packages/
  api/         # tRPC routers
  db/          # Drizzle schema, Supabase clients
  ui/          # shadcn-ui components
```

## Commands

```bash
pnpm dev              # All packages (turbo watch)
pnpm dev-nextjs       # Web only
pnpm db-start         # Start local Supabase
pnpm db-stop          # Stop Supabase
pnpm db-reset         # Reset DB
pnpm db-push          # Push schema to local
pnpm db-push-remote   # Push schema to production
pnpm lint             # ESLint
pnpm format           # Prettier check
pnpm typecheck        # TypeScript
pnpm build            # Build all
```

## DB (packages/db)

```bash
pnpm -F db studio     # Drizzle Studio
pnpm -F db seed       # Run seed script
pnpm -F db generate   # Generate migrations + types
pnpm -F db typegen    # Regenerate Supabase types
```

## Issue Tracking

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

