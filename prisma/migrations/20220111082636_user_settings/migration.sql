/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Setting` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `User` DROP COLUMN `updatedAt`,
    ADD COLUMN `weeklyDigestEmail` BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE `Setting`;
