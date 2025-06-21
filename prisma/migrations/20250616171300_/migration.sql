/*
  Warnings:

  - You are about to drop the column `question_section_id` on the `aiTestQuestionSuggestion` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[test_id]` on the table `aiTestQuestionSuggestion` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `test_id` to the `aiTestQuestionSuggestion` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "aiTestQuestionSuggestion" DROP CONSTRAINT "aiTestQuestionSuggestion_id_fkey";

-- DropIndex
DROP INDEX "aiTestQuestionSuggestion_question_section_id_key";

-- AlterTable
ALTER TABLE "aiTestQuestionSuggestion" DROP COLUMN "question_section_id",
ADD COLUMN     "test_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "aiTestQuestionSuggestion_test_id_key" ON "aiTestQuestionSuggestion"("test_id");

-- AddForeignKey
ALTER TABLE "aiTestQuestionSuggestion" ADD CONSTRAINT "aiTestQuestionSuggestion_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
