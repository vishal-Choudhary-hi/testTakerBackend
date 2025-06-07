-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('live', 'draft', 'result_pending', 'completed');

-- CreateEnum
CREATE TYPE "CloudService" AS ENUM ('cloudinary');

-- CreateEnum
CREATE TYPE "ExpiryActions" AS ENUM ('deleteAfterTestExpiry');

-- CreateEnum
CREATE TYPE "UploadedByModelType" AS ENUM ('userTestCreater');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "otp" INTEGER,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "typeName" TEXT NOT NULL,
    "url" TEXT,
    "request" JSONB,
    "response" JSONB,
    "method" TEXT,
    "headers" JSONB,
    "status" INTEGER NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "emailType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "sentOn" TIMESTAMP(3),
    "failureReason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test" (
    "id" SERIAL NOT NULL,
    "test_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "study_material" TEXT,
    "invite_email_additional_content" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "duration_in_seconds" INTEGER NOT NULL,
    "status" "TestStatus" NOT NULL DEFAULT 'draft',
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestInstruction" (
    "id" SERIAL NOT NULL,
    "test_id" INTEGER NOT NULL,
    "heading" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestInstruction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "question_section_id" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type_id" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "image" TEXT,
    "negative_score_on_wrong_answer" INTEGER NOT NULL,
    "score_on_correct_answer" INTEGER NOT NULL,
    "manual_scoring" BOOLEAN NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionSection" (
    "id" SERIAL NOT NULL,
    "test_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "total_score" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER NOT NULL,

    CONSTRAINT "QuestionSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Option" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "is_correct" BOOLEAN NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionType" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "allow_options" BOOLEAN NOT NULL DEFAULT false,
    "allow_multiple_correct_answer" BOOLEAN NOT NULL DEFAULT false,
    "score_manually" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestInvitation" (
    "id" SERIAL NOT NULL,
    "test_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "verification_image_document_id" INTEGER NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" INTEGER NOT NULL,
    "additional_details" JSONB,
    "email_status" BOOLEAN NOT NULL DEFAULT false,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestParticipant" (
    "id" SERIAL NOT NULL,
    "test_id" INTEGER NOT NULL,
    "test_invitation_id" INTEGER NOT NULL,
    "participated" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelectedOptionMapping" (
    "id" SERIAL NOT NULL,
    "test_id" INTEGER NOT NULL,
    "test_participant_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "option_ids" JSONB,
    "input_value" TEXT,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "is_correct" BOOLEAN DEFAULT false,
    "manual_score" INTEGER,
    "score" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SelectedOptionMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestScore" (
    "id" SERIAL NOT NULL,
    "test_participant_id" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "total_positive_score" INTEGER NOT NULL,
    "total_negative_score" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentCategory" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "expiryAction" "ExpiryActions" NOT NULL DEFAULT 'deleteAfterTestExpiry',
    "allowedFileTypes" JSONB NOT NULL,
    "maxFileSize" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documents" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "path" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "cloud_service" "CloudService" NOT NULL DEFAULT 'cloudinary',
    "uploadedByModelId" INTEGER NOT NULL,
    "UploadedByModelType" "UploadedByModelType" NOT NULL,
    "status" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "documentCategoryId" INTEGER NOT NULL,

    CONSTRAINT "Documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_emailId_key" ON "User"("emailId");

-- CreateIndex
CREATE UNIQUE INDEX "TestInvitation_test_id_email_key" ON "TestInvitation"("test_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "TestParticipant_test_id_test_invitation_id_key" ON "TestParticipant"("test_id", "test_invitation_id");

-- CreateIndex
CREATE UNIQUE INDEX "TestParticipant_test_invitation_id_key" ON "TestParticipant"("test_invitation_id");

-- CreateIndex
CREATE UNIQUE INDEX "SelectedOptionMapping_test_id_test_participant_id_question__key" ON "SelectedOptionMapping"("test_id", "test_participant_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "TestScore_test_participant_id_key" ON "TestScore"("test_participant_id");

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestInstruction" ADD CONSTRAINT "TestInstruction_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "QuestionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_question_section_id_fkey" FOREIGN KEY ("question_section_id") REFERENCES "QuestionSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSection" ADD CONSTRAINT "QuestionSection_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSection" ADD CONSTRAINT "QuestionSection_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestInvitation" ADD CONSTRAINT "TestInvitation_verification_image_document_id_fkey" FOREIGN KEY ("verification_image_document_id") REFERENCES "Documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestInvitation" ADD CONSTRAINT "TestInvitation_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestParticipant" ADD CONSTRAINT "TestParticipant_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestParticipant" ADD CONSTRAINT "TestParticipant_test_invitation_id_fkey" FOREIGN KEY ("test_invitation_id") REFERENCES "TestInvitation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelectedOptionMapping" ADD CONSTRAINT "SelectedOptionMapping_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelectedOptionMapping" ADD CONSTRAINT "SelectedOptionMapping_test_participant_id_fkey" FOREIGN KEY ("test_participant_id") REFERENCES "TestParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelectedOptionMapping" ADD CONSTRAINT "SelectedOptionMapping_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestScore" ADD CONSTRAINT "TestScore_test_participant_id_fkey" FOREIGN KEY ("test_participant_id") REFERENCES "TestParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documents" ADD CONSTRAINT "Documents_documentCategoryId_fkey" FOREIGN KEY ("documentCategoryId") REFERENCES "DocumentCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
