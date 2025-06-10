/*
  Warnings:

  - You are about to drop the column `returnData` on the `cronJobLogs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cronJobLogs" DROP COLUMN "returnData",
ADD COLUMN     "return_data" JSONB;
