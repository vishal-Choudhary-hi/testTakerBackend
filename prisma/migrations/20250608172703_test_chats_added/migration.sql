-- CreateTable
CREATE TABLE "TestChats" (
    "id" SERIAL NOT NULL,
    "test_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestChats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestChats_test_id_idx" ON "TestChats"("test_id");

-- CreateIndex
CREATE INDEX "TestChats_sender_id_idx" ON "TestChats"("sender_id");
