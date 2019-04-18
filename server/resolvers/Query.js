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
    debugger;
    if (!context.userId) return null;
    return context.prisma.user({ id: context.userId });
  },
  feed: (parent, args, context) => {
    return context.prisma.posts({ where: { published: true } });
  },
  filterPosts: (parent, { searchString }, context) => {
    return context.prisma.posts({
      where: {
        content_contains: searchString,
      },
    });
  },
  post: (parent, { id }, context) => {
    return context.prisma.post({ id });
  },
};

module.exports = {
  Query,
};
