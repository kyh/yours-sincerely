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
  me: (parent, args, context) => {
    if (!context.user) return null;
    return context.prisma.user({ id: context.user.userId });
  },
  posts: forwardTo('prisma'),
  post: forwardTo('prisma'),
  postsConnection: forwardTo('prisma'),
};

module.exports = {
  Query,
};
