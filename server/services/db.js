const { Prisma } = require('prisma-binding');
const keys = require('@server/config/keys');

const db = new Prisma({
  typeDefs: 'server/schema/generated/prisma.graphql',
  endpoint: keys.db.prismaEndpoint,
  secret: keys.db.prismaSecret,
  debug: false,
});

module.exports = db;
