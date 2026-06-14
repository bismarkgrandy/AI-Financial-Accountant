/*
  Warnings:

  - You are about to drop the column `amountOriginal` on the `creditors` table. All the data in the column will be lost.
  - You are about to drop the column `amountOutstanding` on the `creditors` table. All the data in the column will be lost.
  - You are about to drop the column `debtDate` on the `creditors` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `creditors` table. All the data in the column will be lost.
  - You are about to drop the column `journalEntryId` on the `creditors` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `creditors` table. All the data in the column will be lost.
  - You are about to drop the column `supplierName` on the `creditors` table. All the data in the column will be lost.
  - You are about to drop the column `supplierPhone` on the `creditors` table. All the data in the column will be lost.
  - You are about to drop the column `amountOriginal` on the `debtors` table. All the data in the column will be lost.
  - You are about to drop the column `amountOutstanding` on the `debtors` table. All the data in the column will be lost.
  - You are about to drop the column `customerName` on the `debtors` table. All the data in the column will be lost.
  - You are about to drop the column `customerPhone` on the `debtors` table. All the data in the column will be lost.
  - You are about to drop the column `debtDate` on the `debtors` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `debtors` table. All the data in the column will be lost.
  - You are about to drop the column `journalEntryId` on the `debtors` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `debtors` table. All the data in the column will be lost.
  - Added the required column `name` to the `creditors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `debtors` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "creditors" DROP CONSTRAINT "creditors_journalEntryId_fkey";

-- DropForeignKey
ALTER TABLE "debtors" DROP CONSTRAINT "debtors_journalEntryId_fkey";

-- DropIndex
DROP INDEX "creditors_businessId_status_idx";

-- DropIndex
DROP INDEX "debtors_businessId_status_idx";

-- AlterTable
ALTER TABLE "creditors" DROP COLUMN "amountOriginal",
DROP COLUMN "amountOutstanding",
DROP COLUMN "debtDate",
DROP COLUMN "dueDate",
DROP COLUMN "journalEntryId",
DROP COLUMN "status",
DROP COLUMN "supplierName",
DROP COLUMN "supplierPhone",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "debtors" DROP COLUMN "amountOriginal",
DROP COLUMN "amountOutstanding",
DROP COLUMN "customerName",
DROP COLUMN "customerPhone",
DROP COLUMN "debtDate",
DROP COLUMN "dueDate",
DROP COLUMN "journalEntryId",
DROP COLUMN "status",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "debts" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "debtorId" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "amountOriginal" DECIMAL(10,2) NOT NULL,
    "amountOutstanding" DECIMAL(10,2) NOT NULL,
    "debtDate" DATE NOT NULL,
    "dueDate" DATE,
    "status" "DebtStatus" NOT NULL DEFAULT 'outstanding',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payables" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "creditorId" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "amountOriginal" DECIMAL(10,2) NOT NULL,
    "amountOutstanding" DECIMAL(10,2) NOT NULL,
    "debtDate" DATE NOT NULL,
    "dueDate" DATE,
    "status" "DebtStatus" NOT NULL DEFAULT 'outstanding',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "debts_businessId_status_idx" ON "debts"("businessId", "status");

-- CreateIndex
CREATE INDEX "debts_debtorId_idx" ON "debts"("debtorId");

-- CreateIndex
CREATE INDEX "payables_businessId_status_idx" ON "payables"("businessId", "status");

-- CreateIndex
CREATE INDEX "payables_creditorId_idx" ON "payables"("creditorId");

-- CreateIndex
CREATE INDEX "creditors_businessId_isActive_idx" ON "creditors"("businessId", "isActive");

-- CreateIndex
CREATE INDEX "debtors_businessId_isActive_idx" ON "debtors"("businessId", "isActive");

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_debtorId_fkey" FOREIGN KEY ("debtorId") REFERENCES "debtors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payables" ADD CONSTRAINT "payables_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payables" ADD CONSTRAINT "payables_creditorId_fkey" FOREIGN KEY ("creditorId") REFERENCES "creditors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payables" ADD CONSTRAINT "payables_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
