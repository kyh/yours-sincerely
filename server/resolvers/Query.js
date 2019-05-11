const { forwardTo } = require('prisma-binding');
const Moniker = require('moniker');

const usernameGenerator = Moniker.generator([
  Moniker.adjective,
  Moniker.adjective,
  Moniker.noun,
]);

const Query = {
  randomUsername: () => {
    return usernameGenerator.choose();
  },
  me: (parent, args, context, info) => {
    if (!context.user) return null;
    return context.prisma.query.user(
      { where: { id: context.user.userId } },
      info,
    );
  },
  posts: forwardTo('prisma'),
  post: forwardTo('prisma'),
  postsConnection: forwardTo('prisma'),
};

module.exports = {
  Query,
};
