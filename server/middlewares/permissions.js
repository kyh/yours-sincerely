const { rule, shield } = require('graphql-shield');

const rules = {
  isAuthenticatedUser: rule()((parent, args, context) => {
    return Boolean(context.userId);
  }),
  isPostOwner: rule()(async (parent, { id }, context) => {
    const author = await context.prisma.post({ id }).author();
    return context.userId === author.id;
  }),
};

module.exports = shield({
  Query: {},
  Mutation: {
    createDraft: rules.isAuthenticatedUser,
    deletePost: rules.isPostOwner,
    publish: rules.isPostOwner,
  },
});
