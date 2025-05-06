-- AlterTable
ALTER TABLE `questiontype` ADD COLUMN `allow_multiple_correct_answer` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `allow_options` BOOLEAN NOT NULL DEFAULT false;
