/*
  Warnings:

  - You are about to drop the column `user_id` on the `testparticipant` table. All the data in the column will be lost.
  - Added the required column `test_invitation_id` to the `TestParticipant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `testparticipant` DROP COLUMN `user_id`,
    ADD COLUMN `test_invitation_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `TestParticipant` ADD CONSTRAINT `TestParticipant_test_invitation_id_fkey` FOREIGN KEY (`test_invitation_id`) REFERENCES `TestInvitation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
