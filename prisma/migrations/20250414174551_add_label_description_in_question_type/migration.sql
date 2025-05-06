/*
  Warnings:

  - Added the required column `description` to the `QuestionType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `label` to the `QuestionType` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `questiontype` ADD COLUMN `description` VARCHAR(191) NOT NULL,
    ADD COLUMN `label` VARCHAR(191) NOT NULL;
