import concurrently from "concurrently";

const dbUrl = process.env.DATABASE_MIGRATION_URL;

concurrently([
  `pscale connect yours-sincerely shadow --port 3310`,
  `DATABASE_URL=${dbUrl} npx prisma db push --accept-data-loss`,
]);
