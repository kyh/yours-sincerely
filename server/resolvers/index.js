const { Query } = require('./Query');
const { Mutation } = require('./Mutation');
const { User } = require('./User');
const { Post } = require('./Post');
const { Subscription } = require('./Subscription');

const resolvers = {
  Query,
  Mutation,
  // Subscription,
  User,
  Post,
};

module.exports = {
  resolvers,
};
