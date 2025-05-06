/*
  Warnings:

  - Added the required column `verification_image_document_id` to the `TestInvitation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `testinvitation` ADD COLUMN `verification_image_document_id` INTEGER NOT NULL;
