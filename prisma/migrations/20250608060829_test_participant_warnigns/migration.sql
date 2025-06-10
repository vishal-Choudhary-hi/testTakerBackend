-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "total_warning_allowed" INTEGER NOT NULL DEFAULT 50;

-- CreateTable
CREATE TABLE "ParticipantWarnings" (
    "id" SERIAL NOT NULL,
    "test_participant_id" INTEGER NOT NULL,
    "warning_message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParticipantWarnings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ParticipantWarnings" ADD CONSTRAINT "ParticipantWarnings_test_participant_id_fkey" FOREIGN KEY ("test_participant_id") REFERENCES "TestParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
