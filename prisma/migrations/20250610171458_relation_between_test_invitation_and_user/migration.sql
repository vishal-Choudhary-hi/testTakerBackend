-- AddForeignKey
ALTER TABLE "TestInvitation" ADD CONSTRAINT "TestInvitation_email_fkey" FOREIGN KEY ("email") REFERENCES "User"("emailId") ON DELETE RESTRICT ON UPDATE CASCADE;
