/*
  Warnings:

  - You are about to drop the column `hashedToken` on the `Token` table. All the data in the column will be lost.
  - The values [VERIFY_PASSWORD] on the enum `Token_type` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[token,type]` on the table `Token` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `token` to the `Token` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Token_hashedToken_type_key` ON `Token`;

-- AlterTable
ALTER TABLE `Token` DROP COLUMN `hashedToken`,
    ADD COLUMN `token` VARCHAR(191) NOT NULL,
    MODIFY `type` ENUM('REFRESH_TOKEN', 'VERIFY_EMAIL', 'RESET_PASSWORD') NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Token_token_type_key` ON `Token`(`token`, `type`);
