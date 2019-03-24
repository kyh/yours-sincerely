const { prisma } = require('../server/db/generated/prisma-client');

async function main() {
  await prisma.createUser({
    email: 'im.kaiyu@gmail.com',
    name: 'Alice',
    password: '$2b$10$dqyYw5XovLjpmkYNiRDEWuwKaRAvLaG45fnXE5b3KTccKZcRPka2m', // "secret42"
    posts: {
      create: {
        title: 'Join us for GraphQL Conf 2019 in Berlin',
        content: 'https://www.graphqlconf.org/',
        published: true,
      },
    },
  });
  await prisma.createUser({
    email: 'cathy@abc.io',
    name: 'Cathy',
    password: '$2b$10$o6KioO.taArzboM44Ig85O3ZFZYZpR3XD7mI8T29eP4znU/.xyJbW', // "secret43"
    posts: {
      create: [
        {
          title: 'Subscribe to GraphQL Weekly for community news',
          content: 'https://graphqlweekly.com/',
          published: true,
        },
        {
          title: 'Follow Prisma on Twitter',
          content: 'https://twitter.com/prisma',
        },
      ],
    },
  });
}

main();
