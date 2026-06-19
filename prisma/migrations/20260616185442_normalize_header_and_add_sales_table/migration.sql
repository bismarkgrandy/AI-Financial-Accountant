/*
  Warnings:

  - You are about to drop the column `cashInHandEod` on the `journal_entries` table. All the data in the column will be lost.
  - You are about to drop the column `customerName` on the `journal_entries` table. All the data in the column will be lost.
  - You are about to drop the column `expenseCategory` on the `journal_entries` table. All the data in the column will be lost.
  - You are about to drop the column `expenseDescription` on the `journal_entries` table. All the data in the column will be lost.
  - You are about to drop the column `momoBalanceEod` on the `journal_entries` table. All the data in the column will be lost.
  - You are about to drop the column `paidTo` on the `journal_entries` table. All the data in the column will be lost.
  - You are about to drop the column `receiptPrinted` on the `journal_entries` table. All the data in the column will be lost.
  - You are about to drop the column `receiptSentTo` on the `journal_entries` table. All the data in the column will be lost.
  - You are about to drop the column `supplierName` on the `journal_entries` table. All the data in the column will be lost.
  - You are about to drop the column `voidReason` on the `journal_entries` table. All the data in the column will be lost.
  - You are about to drop the column `voidedAt` on the `journal_entries` table. All the data in the column will be lost.
  - You are about to drop the column `voidedById` on the `journal_entries` table. All the data in the column will be lost.
  - Added the required column `saleId` to the `sale_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "journal_entries" DROP CONSTRAINT "journal_entries_voidedById_fkey";

-- AlterTable
ALTER TABLE "journal_entries" DROP COLUMN "cashInHandEod",
DROP COLUMN "customerName",
DROP COLUMN "expenseCategory",
DROP COLUMN "expenseDescription",
DROP COLUMN "momoBalanceEod",
DROP COLUMN "paidTo",
DROP COLUMN "receiptPrinted",
DROP COLUMN "receiptSentTo",
DROP COLUMN "supplierName",
DROP COLUMN "voidReason",
DROP COLUMN "voidedAt",
DROP COLUMN "voidedById";

-- AlterTable
ALTER TABLE "sale_items" ADD COLUMN     "saleId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "isCredit" BOOLEAN NOT NULL DEFAULT false,
    "totalRevenue" DECIMAL(10,2) NOT NULL,
    "totalCogs" DECIMAL(10,2) NOT NULL,
    "grossProfit" DECIMAL(10,2) NOT NULL,
    "debtorId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sales_businessId_createdAt_idx" ON "sales"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "sales_journalEntryId_idx" ON "sales"("journalEntryId");

-- CreateIndex
CREATE INDEX "sales_debtorId_idx" ON "sales"("debtorId");

-- CreateIndex
CREATE INDEX "sale_items_saleId_idx" ON "sale_items"("saleId");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_debtorId_fkey" FOREIGN KEY ("debtorId") REFERENCES "debtors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
