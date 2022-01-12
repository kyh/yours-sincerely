-- DropIndex
DROP INDEX `Account_userId_idx` ON `Account`;

-- DropIndex
DROP INDEX `Post_parentId_userId_idx` ON `Post`;

-- DropIndex
DROP INDEX `Token_userId_idx` ON `Token`;

-- CreateIndex
CREATE INDEX `Post_id_userId_idx` ON `Post`(`id`, `userId`);
