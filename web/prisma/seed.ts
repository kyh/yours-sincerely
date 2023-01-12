import { PrismaClient } from "@prisma/client";
import { prompts } from "./prompts";

const prisma = new PrismaClient();

async function main() {
  // reset prompt table
  await prisma.prompt.deleteMany({});

  await prisma.prompt.createMany({
    data: prompts.map((p) => ({ content: p })),
    skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
