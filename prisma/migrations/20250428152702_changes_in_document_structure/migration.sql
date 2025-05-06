/*
  Warnings:

  - You are about to drop the column `expiryAction` on the `documents` table. All the data in the column will be lost.
  - Added the required column `UploadedByModelType` to the `Documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `documentCategoryId` to the `Documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadedByModelId` to the `Documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `documentcategory` ADD COLUMN `expiryAction` ENUM('deleteAfterTestExpiry') NOT NULL DEFAULT 'deleteAfterTestExpiry';

-- AlterTable
ALTER TABLE `documents` DROP COLUMN `expiryAction`,
    ADD COLUMN `UploadedByModelType` ENUM('userTestCreater') NOT NULL,
    ADD COLUMN `documentCategoryId` INTEGER NOT NULL,
    ADD COLUMN `uploadedByModelId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Documents` ADD CONSTRAINT `Documents_documentCategoryId_fkey` FOREIGN KEY (`documentCategoryId`) REFERENCES `DocumentCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
