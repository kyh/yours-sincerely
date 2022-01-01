/*
  Warnings:

  - The primary key for the `Flag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Flag` table. All the data in the column will be lost.
  - The primary key for the `Like` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Like` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Flag" DROP CONSTRAINT "Flag_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Flag_pkey" PRIMARY KEY ("postId", "userId");

-- AlterTable
ALTER TABLE "Like" DROP CONSTRAINT "Like_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Like_pkey" PRIMARY KEY ("postId", "userId");
