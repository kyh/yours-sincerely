/*
  Warnings:

  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_postId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "parentId" TEXT;

-- DropTable
DROP TABLE "Comment";

-- CreateTable
CREATE TABLE "Blocks" (
    "blockerId" TEXT NOT NULL,
    "blockingId" TEXT NOT NULL,

    CONSTRAINT "Blocks_pkey" PRIMARY KEY ("blockerId","blockingId")
);

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blocks" ADD CONSTRAINT "Blocks_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blocks" ADD CONSTRAINT "Blocks_blockingId_fkey" FOREIGN KEY ("blockingId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
