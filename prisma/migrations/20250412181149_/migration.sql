/*
  Warnings:

  - You are about to drop the column `email_status` on the `testinvitation` table. All the data in the column will be lost.
  - You are about to drop the column `invite_email` on the `testinvitation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[test_id,email]` on the table `TestInvitation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `TestInvitation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `TestInvitation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `testinvitation` DROP COLUMN `email_status`,
    DROP COLUMN `invite_email`,
    ADD COLUMN `email` VARCHAR(191) NOT NULL,
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `status` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `accepted` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `additional_details` JSON NULL;

-- CreateIndex
CREATE UNIQUE INDEX `TestInvitation_test_id_email_key` ON `TestInvitation`(`test_id`, `email`);
