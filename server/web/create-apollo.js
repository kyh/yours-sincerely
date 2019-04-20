const { ApolloServer } = require('apollo-server-express');
const { prisma } = require('@server/schema/generated/prisma-client');
const keys = require('@server/config/keys');
const schema = require('@server/schema');
const { getUser } = require('@server/util/authentication');

function createApollo() {
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }) => {
      console.log(req.headers);
      return {
        prisma,
        request: req,
        response: res,
        user: getUser(req.headers.authorization),
      };
    },
    playground: keys.nodeEnv === 'development',
    debug: keys.nodeEnv === 'development',
    cors: { credentials: true },
  });

  return apolloServer;
}

module.exports = createApollo;
