-- DropForeignKey
ALTER TABLE `Account` DROP FOREIGN KEY `Account_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Block` DROP FOREIGN KEY `Block_blockerId_fkey`;

-- DropForeignKey
ALTER TABLE `Block` DROP FOREIGN KEY `Block_blockingId_fkey`;

-- DropForeignKey
ALTER TABLE `Flag` DROP FOREIGN KEY `Flag_postId_fkey`;

-- DropForeignKey
ALTER TABLE `Flag` DROP FOREIGN KEY `Flag_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Like` DROP FOREIGN KEY `Like_postId_fkey`;

-- DropForeignKey
ALTER TABLE `Like` DROP FOREIGN KEY `Like_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Post` DROP FOREIGN KEY `Post_parentId_fkey`;

-- DropForeignKey
ALTER TABLE `Post` DROP FOREIGN KEY `Post_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Token` DROP FOREIGN KEY `Token_userId_fkey`;
