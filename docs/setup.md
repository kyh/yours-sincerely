# Setup Yours Sincerely locally

### Foreword

If you see a step below that could be improved (or is outdated), please update the instructions. We rarely go through this process ourselves, so your fresh pair of eyes and your recent experience with it, makes you the best candidate to improve them for other users. Thank you!

### Prerequisite

1. Make sure you have Node.js version >= 10.

- We recommend using [nvm](https://github.com/creationix/nvm): `nvm use`.

2. You'll need the Prisma CLI. Please install it via NPM or [using another method](https://www.prisma.io/docs/prisma-cli-and-configuration/using-the-prisma-cli-alx4/#installation):

```
npm install -g prisma
```

##### Optional

3. If you're going to be deploying, you'll also need to install the Heroku CLI. Please install it from [here](https://devcenter.heroku.com/articles/heroku-cli#download-and-install).

You'll also need to set up your git remotes:
```
heroku git:remote -a ys-development
git remote rename heroku prod

heroku git:remote -a ys-app
git remote rename heroku dev
```

### Getting Started

Yours Sincerely uses a **GraphQL server** built with [express](https://github.com/expressjs/express) & [apollo-server](https://github.com/apollographql/apollo-server). The database interface uses [Prisma](https://github.com/prisma/prisma). Frontend is a SSR **React app** via [next.js](https://github.com/zeit/next.js).

#### How to install

We recommend cloning the repository in a folder dedicated to `Yours Sincerely` projects.

```
git clone git@github.com:/its-bananas/yours-sincerely.git ys/app
cd ys/app
npm run setup
```

If you're going to be deploying, you could run:
```
node tools/generate-env
# This will generate .env.dev and .env.prod environment files
```
Note: This will require Heroku access, please reach out to YS repo owners to be added.

### Building and Running Locally

#### To start a dev web server:

```bash
npm run dev
```

This will do two things:

1.  Start the Webpack Dev Server that serves assets in the client directory (it will refresh the page on any changes)
2.  Start a nodemon server for the server directory which will watch all server files and restart the server on changes

#### To build a production version of the app:

```bash
npm run build
npm start
```

You can then load: [http://localhost:5000/](http://localhost:5000/)

## Deployment

To deploy to staging or production, you need to be a core member of the YS team.

#### To deploy to development or production:

```bash
npm run deploy
```

The deploy script will guide you through the rest of the deployment process.

## Debugging Tips

You can debug node apps by attaching an `ndb` instance to your running node server. First install the
[ndb](https://www.npmjs.com/package/ndb) package into your global environment:

```bash
npm i -g ndb
```

You can now use the node debugger to profile, add breakpoints, log errors, and even inject JavaScript
without needing to restart the server! Start the debugger by running:

```bash
npm run debug
```

## Style Guide

JavaScript - this project follows the [Airbnb Style Guide](https://github.com/airbnb/javascript) along with [Prettier](https://prettier.io/) formatting.
