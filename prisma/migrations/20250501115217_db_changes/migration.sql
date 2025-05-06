/*
  Warnings:

  - You are about to drop the column `documentsId` on the `testinvitation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `testinvitation` DROP FOREIGN KEY `TestInvitation_documentsId_fkey`;

-- DropIndex
DROP INDEX `TestInvitation_documentsId_fkey` ON `testinvitation`;

-- AlterTable
ALTER TABLE `testinvitation` DROP COLUMN `documentsId`;

-- AddForeignKey
ALTER TABLE `TestInvitation` ADD CONSTRAINT `TestInvitation_verification_image_document_id_fkey` FOREIGN KEY (`verification_image_document_id`) REFERENCES `Documents`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
