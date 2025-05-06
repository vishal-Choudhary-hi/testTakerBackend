-- DropForeignKey
ALTER TABLE `log` DROP FOREIGN KEY `Log_userId_fkey`;

-- DropIndex
DROP INDEX `Log_userId_fkey` ON `log`;

-- AlterTable
ALTER TABLE `log` ADD COLUMN `method` VARCHAR(191) NULL,
    MODIFY `request` JSON NULL,
    MODIFY `response` JSON NULL,
    MODIFY `headers` JSON NULL,
    MODIFY `userId` INTEGER NULL;
