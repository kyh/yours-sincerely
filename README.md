[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/kyh/yours-sincerely/issues)
[![GitHub last commit](https://img.shields.io/github/last-commit/kyh/yours-sincerely)](https://github.com/kyh/yours-sincerely)
[![Discord](https://img.shields.io/badge/Discord-Join%20Chat-%237289DA)](https://discord.gg/YtafKzR)

# Yours Sincerely

[App Store](https://apps.apple.com/ag/app/yours-sincerely/id1510472230) | [Play Store](https://play.google.com/store/apps/details?id=com.kyh.yourssincerely) | [Website](https://yourssincerely.org/)

> Write as if your arms are wide open, and hold them far apart. An ephemeral anonymous blog to send each other tiny beautiful letters

## 👉 Get Started

The application follows a typical [Remix](https://remix.run/docs/en/v1/tutorials/blog) application structure. You can find the entry point the web application in the `app` directory.

You'll notice that the Remix routes are just thin wrappers and most of the heavy lifting code is done in the `/lib` directory.

```
├── /api                     # Remix server
├── /app                     # Web client
|   ├── /lib                 # Feature source code (most of the logic lives here)
|   └── /routes              # Remix file sytem routes
├── /prisma                  # Prisma schema and database associated files
├── /public                  # Static assets
└── /styles                  # Global styles
```

### Install dependencies

- [Node.js](https://nodejs.org/en/) - LTS version recommended
- [Docker](https://www.docker.com/get-started) - [Compose](https://docs.docker.com/compose/) to run multi containers locally

### Local Development

```sh
# Installing dependencies
npm install

# Start a docker container containing your local database
npm run docker:start
# If you run into `invalid mount config for type "bind": bind source path does not exist: /db` error, you need to create a db folder - `mkdir db`

# Run db migrations
npm run db:migrate:dev

# Seed your database
npm run db:seed

# To start the apps
npm run dev # or npm run dev:api && npm run dev:web if you'd like to run them independently
```

This will start the [Remix](https://remix.run) development server. When the above command completes you'll be able to view your website at `http://localhost:3000`

## 🥞 Stack

This project uses the following libraries and services:

- Framework - [Remix](https://remix.run)
- Styling - [Tailwind](https://tailwindcss.com)
- Database - [MySQL (PlanetScale)](https://planetscale.com/) + [Prisma](https://www.prisma.io/)
- Payments - [Stripe](https://stripe.com)
- Analytics - [Splitbee](https://splitbee.io/)
- Hosting - [Vercel](https://vercel.com)

## 📚 Documentation

For further documentation you can refer to the [`/docs`](/docs) directory.
