/*
  Warnings:

  - Added the required column `allowedFileTypes` to the `DocumentCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxFileSize` to the `DocumentCategory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `documentcategory` ADD COLUMN `allowedFileTypes` JSON NOT NULL,
    ADD COLUMN `maxFileSize` INTEGER NOT NULL;
