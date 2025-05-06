/*
  Warnings:

  - The values [delete,confirmed,done] on the enum `Test_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `test` MODIFY `status` ENUM('live', 'draft', 'result_pending', 'completed') NOT NULL DEFAULT 'draft';
