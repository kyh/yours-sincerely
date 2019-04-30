Object.defineProperty(exports, '__esModule', { value: true });
const prisma_lib_1 = require('prisma-client-lib');
const { typeDefs } = require('./prisma-schema');

const models = [
  {
    name: 'Permission',
    embedded: false,
  },
  {
    name: 'User',
    embedded: false,
  },
  {
    name: 'Post',
    embedded: false,
  },
];
exports.Prisma = prisma_lib_1.makePrismaClientClass({
  typeDefs,
  models,
  endpoint: `${process.env.PRISMA_ENDPOINT}`,
  secret: `${process.env.PRISMA_SECRET}`,
});
exports.prisma = new exports.Prisma();
