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
