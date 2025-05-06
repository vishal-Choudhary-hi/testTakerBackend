/*
  Warnings:

  - You are about to drop the column `emailIdSha` on the `user` table. All the data in the column will be lost.
  - Added the required column `failureReason` to the `EmailLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `emaillog` ADD COLUMN `failureReason` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `emailIdSha`;
