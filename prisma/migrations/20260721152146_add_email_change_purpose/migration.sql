-- AlterEnum
ALTER TYPE "VerificationPurpose" ADD VALUE 'email_change';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "pendingEmail" TEXT;
