[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/kyh/yours-sincerely/issues)
[![GitHub last commit](https://img.shields.io/github/last-commit/kyh/yours-sincerely)](https://github.com/kyh/yours-sincerely)
[![Discord](https://img.shields.io/badge/Discord-Join%20Chat-%237289DA)](https://discord.gg/YtafKzR)

# Yours Sincerely

[🚀 Website](https://yourssincerely.org/) | [App Store](https://apps.apple.com/ag/app/yours-sincerely/id1510472230) | [Play Store](https://play.google.com/store/apps/details?id=com.kyh.yourssincerely)

> An ephemeral anonymous blog to send each other tiny beautiful letters 💌

## Get Started

The application is built on a modified version of the [T3 Turbo stack](https://github.com/t3-oss/create-t3-turbo) (to include Supabase).

The native apps are built on [capacitor](https://capacitorjs.com/) which can be found in the `apps/capacitor` directory.

``text
.vscode
└─ Recommended extensions and settings for VSCode users
apps
├─ expo
| └─ In Progress
├─ capacitor
| └─ iOS & Android apps
└─ next.js
└─ Web client and server
packages
├─ api
| └─ tRPC router definitions
├─ db
| └─ Drizzle database setup and Supabase clients
├─ tailwind
| └─ Shared Tailwind configuration between web and native clients
└─ ui
└─ UI package for the webapp using shadcn-ui

````

> Since some folks have asked, I'll be open sourcing the modified template this app is based off soon. Follow my account for updates.

### Install dependencies

- [Node.js](https://nodejs.org/en) - LTS version recommended
- [Docker](https://www.docker.com/) - Used for running the database

### Local Development

```sh
# Rename .env.example to .env and update variables
mv .env.example .env

# Installing dependencies
pnpm install

# To start the database
pnpm db:start

# To start the app
pnpm dev:nextjs

# To run native apps (make sure web server is running with the command above)
pnpm dev:ios
pnpm dev:android
````

You'll be able to view the website at `http://localhost:3000`

## Stack

This project uses the following libraries and services:

- Framework - [Next.js](https://nextjs.org/)
- Styling - [Tailwind](https://tailwindcss.com)
- Database - [Postgres (Supabase)](https://supabase.com) + [Drizzle](https://orm.drizzle.team)
- Hosting - [Vercel](https://vercel.com)
- Notifications - [Knock](https://knock.app)
