const { extractFragmentReplacements } = require('prisma-binding');
const { Query } = require('./Query');
const { Mutation } = require('./Mutation');

const resolvers = {
  Query,
  Mutation,
};

module.exports = {
  resolvers,
  fragmentReplacements: extractFragmentReplacements(resolvers),
};
