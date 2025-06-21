-- CreateTable
CREATE TABLE "aiTestQuestionSuggestion" (
    "id" SERIAL NOT NULL,
    "question_section_id" INTEGER NOT NULL,
    "ai_response" JSONB NOT NULL,
    "creator_request" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aiTestQuestionSuggestion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "aiTestQuestionSuggestion" ADD CONSTRAINT "aiTestQuestionSuggestion_id_fkey" FOREIGN KEY ("id") REFERENCES "QuestionSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
