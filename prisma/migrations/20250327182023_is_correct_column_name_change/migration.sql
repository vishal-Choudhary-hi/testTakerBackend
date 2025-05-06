/*
  Warnings:

  - You are about to drop the column `isCorrect` on the `option` table. All the data in the column will be lost.
  - Added the required column `is_correct` to the `Option` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `option` DROP COLUMN `isCorrect`,
    ADD COLUMN `is_correct` BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE `test` ADD COLUMN `status` ENUM('draft', 'delete', 'confirmed') NOT NULL DEFAULT 'draft';
