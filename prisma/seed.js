const { prisma } = require('../server/db/generated/prisma-client');

async function main() {
  await prisma.createUser({
    username: 'kyh',
    email: 'im.kaiyu@gmail.com',
    name: 'Kaiyu',
    password: '$2b$10$dqyYw5XovLjpmkYNiRDEWuwKaRAvLaG45fnXE5b3KTccKZcRPka2m', // "secret42"
    posts: {
      create: [
        {
          content:
            'What does it mean to be a part of something like this? An endless, senseless story. Pen to paper, fingers to keyboard, words to scripture, thoughts to reflections, heart to heart. To have us all just spew out what’s on our minds at the moment -- kind of connects us all, just for a second, doesn’t it?',
          published: true,
        },
        {
          content:
            'If you have trouble falling asleep, write down all the thoughts swimming around your head before getting into bed as a way to clear your mind.',
          published: true,
        },
      ],
    },
  });
}

main();
