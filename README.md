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
  ├─ api
  |  └─ tRPC router definitions and session/auth
  ├─ contracts
  |  └─ Shared domain: zod schemas and pure rules used by both web and expo
  ├─ db
  |  └─ Drizzle schema and Postgres client
  └─ ui
     └─ UI package for the webapp using shadcn-ui
```

### Install dependencies

- [Node.js](https://nodejs.org/en) - LTS version recommended (>= 24)
- [Docker](https://www.docker.com/) - Used for running the database

### Local Development

```sh
# Rename .env.example to .env and update variables
mv .env.example .env

# Set COOKIE_SECRET in .env — sessions are signed with it. The server throws
# without it in production, and falls back to an insecure dev constant locally.

# Installing dependencies
pnpm install

# To start the database
pnpm db:start

# To start the web app
pnpm dev:web

# To start the native app (Expo)
pnpm dev:expo
```

You'll be able to view the website at `http://localhost:3000`

### Checks

```sh
pnpm typecheck
pnpm lint        # oxlint
pnpm format      # oxfmt --check
pnpm test        # node:test
```

## Stack

This project uses the following libraries and services:

- Framework - [Next.js](https://nextjs.org/)
- Native - [Expo](https://expo.dev/) / React Native
- API - [tRPC](https://trpc.io)
- Styling - [Tailwind](https://tailwindcss.com)
- Database - [Postgres (Supabase)](https://supabase.com) + [Drizzle](https://orm.drizzle.team)
- Hosting - [Vercel](https://vercel.com)
- Notifications - [Knock](https://knock.app)
