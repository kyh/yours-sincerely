import { PrismaClient } from "@prisma/client";
import { prompts } from "./prompts";

const prisma = new PrismaClient();

const main = async () => {
  console.log("Start seeding...");
  await prisma.prompt.deleteMany({});

  prompts.map(async (p) => (
    await prisma.prompt.create({
      data: {
        content: p,
      },
    })
  ))

  console.log("Done!");
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
