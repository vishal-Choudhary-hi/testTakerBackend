/*
  Warnings:

  - A unique constraint covering the columns `[question_section_id]` on the table `aiTestQuestionSuggestion` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "aiTestQuestionSuggestion_question_section_id_key" ON "aiTestQuestionSuggestion"("question_section_id");
