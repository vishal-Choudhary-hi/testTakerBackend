-- AddForeignKey
ALTER TABLE `Test` ADD CONSTRAINT `Test_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
