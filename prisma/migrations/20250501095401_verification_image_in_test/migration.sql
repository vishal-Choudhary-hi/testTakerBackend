/*
  Warnings:

  - Added the required column `documentsId` to the `TestInvitation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `testinvitation` ADD COLUMN `documentsId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `TestInvitation` ADD CONSTRAINT `TestInvitation_documentsId_fkey` FOREIGN KEY (`documentsId`) REFERENCES `Documents`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
