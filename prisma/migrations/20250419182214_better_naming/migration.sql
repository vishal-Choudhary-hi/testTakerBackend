/*
  Warnings:

  - You are about to drop the column `number` on the `question` table. All the data in the column will be lost.
  - Added the required column `sequence` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `question` DROP COLUMN `number`,
    ADD COLUMN `sequence` INTEGER NOT NULL;
