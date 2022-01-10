/*
  Warnings:

  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `User` DROP COLUMN `image`,
    DROP COLUMN `name`,
    ADD COLUMN `displayImage` VARCHAR(191) NULL,
    ADD COLUMN `displayName` VARCHAR(191) NULL;
