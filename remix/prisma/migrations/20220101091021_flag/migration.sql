-- AlterTable
ALTER TABLE "Flag" ADD COLUMN     "comment" TEXT,
ADD COLUMN     "resolved" BOOLEAN NOT NULL DEFAULT false;
