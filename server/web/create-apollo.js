const { ApolloServer } = require('apollo-server-express');
const keys = require('@server/config/keys');
const prisma = require('@server/services/db');
const schema = require('@server/schema');
const { parseRequest, getUser } = require('@server/util/authentication');

function createApollo() {
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }) => {
      const token = parseRequest(req);
      return {
        prisma,
        request: req,
        response: res,
        user: getUser(token),
      };
    },
    playground: keys.nodeEnv === 'development',
    debug: keys.nodeEnv === 'development',
    cors: { credentials: true },
  });

  return apolloServer;
}

module.exports = createApollo;
