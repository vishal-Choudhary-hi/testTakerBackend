/*
  Warnings:

  - You are about to drop the column `negitive_score_on_wrong_answer` on the `question` table. All the data in the column will be lost.
  - You are about to drop the column `describtion` on the `test` table. All the data in the column will be lost.
  - You are about to drop the column `describtion` on the `testinstruction` table. All the data in the column will be lost.
  - You are about to drop the column `total_negitive_score` on the `testscore` table. All the data in the column will be lost.
  - Added the required column `negative_score_on_wrong_answer` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Test` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `TestInstruction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_negative_score` to the `TestScore` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `question` DROP COLUMN `negitive_score_on_wrong_answer`,
    ADD COLUMN `negative_score_on_wrong_answer` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `test` DROP COLUMN `describtion`,
    ADD COLUMN `description` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `testinstruction` DROP COLUMN `describtion`,
    ADD COLUMN `description` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `testscore` DROP COLUMN `total_negitive_score`,
    ADD COLUMN `total_negative_score` INTEGER NOT NULL;
