-- CreateEnum
CREATE TYPE "VerificationPurpose" AS ENUM ('email_verification', 'password_reset');

-- AlterTable
ALTER TABLE "email_verifications" ADD COLUMN     "purpose" "VerificationPurpose" NOT NULL DEFAULT 'email_verification';
