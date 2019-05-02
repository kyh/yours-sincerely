const { rule, shield } = require('graphql-shield');

const rules = {
  isAuthenticatedUser: rule()((parent, args, context) => {
    return !!context.user;
  }),
  isPostOwner: rule()(async (parent, { id }, context) => {
    const author = await context.prisma.post({ id }).author();
    return context.user.userId === author.id;
  }),
};

module.exports = shield({
  Query: {},
  Mutation: {
    createPost: rules.isAuthenticatedUser,
    deletePost: rules.isPostOwner,
  },
});
