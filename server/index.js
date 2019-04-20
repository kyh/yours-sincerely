require('module-alias/register');
/**
 * Yours Sincerely web server is built using 3 main libraries:
 * Express: Node http server.
 * - https://github.com/expressjs/express
 *
 * Next.js: React web app SSR.
 * - https://github.com/zeit/next.js
 *
 * GraphQl Apollo server: server graphql endpoints.
 * - https://github.com/apollographql/apollo-server
 *
 * This is the entrypoint to the YS backend. See files under `/web`
 * on the creation of each app.
 */
const createExpress = require('@server/web/create-express');
const createNext = require('@server/web/create-next');
const createApollo = require('@server/web/create-apollo');
const keys = require('@server/config/keys');

const app = createExpress();
const server = createApollo();
const { nextApp, handle } = createNext();

nextApp.prepare().then(() => {
  // Create `/graphql` endpoints.
  server.applyMiddleware({ app });

  // Handle Next.js pages.
  app.get('/p/:id', (req, res) => {
    return nextApp.render(req, res, '/post', { id: req.params.id });
  });

  app.get('*', (req, res, nxt) => {
    return handle(req, res, nxt);
  });

  app.listen({ port: keys.port }, () => {
    console.log(`Server started on port: ${keys.port}`);
  });
});
