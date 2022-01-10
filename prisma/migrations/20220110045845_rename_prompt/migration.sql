/*
  Warnings:

  - You are about to drop the `Prompts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `Prompts`;

-- CreateTable
CREATE TABLE `Prompt` (
    `id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
