-- CreateTable
CREATE TABLE "cronJobLogs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "returnData" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cronJobLogs_pkey" PRIMARY KEY ("id")
);
