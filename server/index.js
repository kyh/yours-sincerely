require('module-alias/register');

/**
 * Web server: GraphQl express server bundled by `GraphQl Yoga`.
 * - https://github.com/prisma/graphql-yoga
 */
const next = require('next');
const path = require('path');
const { GraphQLServer, PubSub } = require('graphql-yoga');

/**
 * Express/Yoga Middlewares.
 */
const avatarsMiddleware = require('adorable-avatars');
const helmet = require('helmet');
const permissions = require('@server/middlewares/permissions');

/**
 * Database: Postgres database with Prisma ORM for GraphQl mapping.
 * - https://github.com/prisma/prisma
 */
const { prisma } = require('@server/db/generated/prisma-client');
const { resolvers } = require('@server/resolvers');

const PORT = process.env.PORT || 5000;
const IS_DEV = process.env.NODE_ENV !== 'production';

// Set up services.
require('express-async-errors');

/**
 * SSR is done using `Next.js`:
 * - https://github.com/zeit/next.js
 */
const app = next({
  dev: IS_DEV,
  dir: path.resolve(__dirname, '../', 'client'),
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Handle GraphQl Subscriptions.
  const pubsub = new PubSub();
  // Start up GraphQl web server.
  const server = new GraphQLServer({
    typeDefs: 'server/db/schema.graphql',
    resolvers,
    middlewares: [permissions],
    context(request) {
      return { ...request, pubsub, prisma };
    },
  });

  // Set up express middlewares.
  server.express.use(helmet());
  server.express.use('/avatars', avatarsMiddleware);

  // Handle Next.js pages.
  server.express.get('/p/:id', (req, res) => {
    app.render(req, res, '/post', { id: req.params.id });
  });

  server.express.get('*', (req, res, nxt) => {
    const { originalUrl } = req;
    if (
      originalUrl.startsWith('/graphql') ||
      originalUrl.startsWith('/playground')
    ) {
      // Skip any /graphql routes.
      return nxt();
    }
    return handle(req, res, nxt);
  });

  server.start(
    {
      port: PORT,
      endpoint: '/graphql',
      playground: '/playground',
      debug: IS_DEV,
    },
    () => {
      console.log(`Listening on port`, PORT);
    },
  );
});
