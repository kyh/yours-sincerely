[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/kyh/yours-sincerely/issues)
[![GitHub last commit](https://img.shields.io/github/last-commit/kyh/yours-sincerely)](https://github.com/kyh/yours-sincerely)

# Yours Sincerely

[🚀 Website](https://yourssincerely.org/) | [App Store](https://apps.apple.com/ag/app/yours-sincerely/id1510472230) | [Play Store](https://play.google.com/store/apps/details?id=com.kyh.yourssincerely)

> Anonymous love letters 💌 written in disappearing ink.

## Get Started

The application is built on a modified version of the [T3 Turbo stack](https://github.com/t3-oss/create-t3-turbo) (to include Supabase).

The native apps are built with [Expo](https://expo.dev/) and live in `apps/expo`.

```text
.vscode
  └─ Recommended extensions and settings for VSCode users

apps
  ├─ web
  |  └─ Web client and server (Next.js)
  ├─ expo
  |  └─ iOS & Android apps (Expo / React Native) — the ones that ship
  └─ mobile
     └─ Legacy Capacitor shell — superseded by apps/expo, pending removal

packages
  ├─ contract
  |  └─ oRPC contract, plus the shared domain: zod schemas and pure rules used by both web and expo
  ├─ db
  |  └─ Drizzle schema and Postgres client
  ├─ service
  |  └─ oRPC routers implementing the contract, and session/auth
  └─ ui
     └─ UI package for the webapp using shadcn-ui
```

### Install dependencies

- [Node.js](https://nodejs.org/en) - LTS version recommended (24.x)
- macOS on Apple silicon, or Linux - the local database is the Supabase CLI (installed by
  `pnpm install`) running Postgres natively, no Docker

### Local Development

```sh
# Copy .env.example to .env and update variables
cp .env.example .env

# Set COOKIE_SECRET in .env (openssl rand -base64 32) — sessions are signed with it.
# `pnpm dev` falls back to an insecure dev constant without it; `pnpm build` and
# `pnpm verify` run as production and fail without it.

# Installing dependencies
pnpm install

# To start the database (local Supabase, no Docker; it writes POSTGRES_URL into .env)
pnpm db:start

# To create the schema — a new local database is EMPTY (every git branch gets its
# own) and there are no migrations to replay, so this step is not optional
pnpm db:push

# To start the web app
pnpm dev:web

# To start the native app (Expo)
pnpm dev:expo
```

You'll be able to view the website at `http://localhost:3000`

### Checks

```sh
pnpm verify      # typecheck + lint + format + test + build — what CI runs

# …or individually
pnpm typecheck
pnpm lint        # oxlint (ultracite presets)
pnpm format      # oxfmt --check
pnpm test        # node:test
pnpm build
```

Coding agents should start from [AGENTS.md](./AGENTS.md).

## Stack

This project uses the following libraries and services:

- Framework - [Next.js](https://nextjs.org/)
- Native - [Expo](https://expo.dev/) / React Native
- API - [oRPC](https://orpc.dev)
- Styling - [Tailwind](https://tailwindcss.com)
- Database - [Postgres (Supabase)](https://supabase.com) + [Drizzle](https://orm.drizzle.team)
- Hosting - [Vercel](https://vercel.com)
- Notifications - in-house feed + [Expo push](https://docs.expo.dev/push-notifications/overview/)
