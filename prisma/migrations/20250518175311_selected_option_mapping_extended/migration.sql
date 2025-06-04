-- AlterTable
ALTER TABLE `SelectedOptionMapping` ADD COLUMN `is_correct` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `manual_score` INTEGER NULL,
    ADD COLUMN `skipped` BOOLEAN NOT NULL DEFAULT false;
