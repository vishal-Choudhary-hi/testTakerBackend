-- AlterTable
ALTER TABLE `test` MODIFY `status` ENUM('draft', 'delete', 'confirmed', 'done') NOT NULL DEFAULT 'draft';
