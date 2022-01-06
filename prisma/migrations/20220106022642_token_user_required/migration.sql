/*
  Warnings:

  - Made the column `userId` on table `Token` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Token` MODIFY `userId` VARCHAR(191) NOT NULL;
