/*
  Warnings:

  - You are about to drop the column `option` on the `option` table. All the data in the column will be lost.
  - You are about to drop the column `test_id` on the `question` table. All the data in the column will be lost.
  - Added the required column `description` to the `Option` table without a default value. This is not possible if the table is not empty.
  - Added the required column `question_section_id` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `question` DROP FOREIGN KEY `Question_test_id_fkey`;

-- DropIndex
DROP INDEX `Question_test_id_fkey` ON `question`;

-- AlterTable
ALTER TABLE `option` DROP COLUMN `option`,
    ADD COLUMN `description` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `question` DROP COLUMN `test_id`,
    ADD COLUMN `question_section_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `QuestionSection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `test_id` INTEGER NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `total_score` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_question_section_id_fkey` FOREIGN KEY (`question_section_id`) REFERENCES `QuestionSection`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionSection` ADD CONSTRAINT `QuestionSection_test_id_fkey` FOREIGN KEY (`test_id`) REFERENCES `Test`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionSection` ADD CONSTRAINT `QuestionSection_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
