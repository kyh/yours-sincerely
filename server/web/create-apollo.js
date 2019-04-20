const { ApolloServer } = require('apollo-server-express');
const keys = require('@server/config/keys');
const prisma = require('@server/schema/generated/prisma-client');
const schema = require('@server/schema');

function createApollo() {
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req }) => ({
      ...req,
      prisma,
    }),
    playground: keys.nodeEnv === 'development',
    debug: keys.nodeEnv === 'development',
  });

  return apolloServer;
}

module.exports = createApollo;
