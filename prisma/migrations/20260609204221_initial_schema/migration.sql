-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('provision_store', 'supermarket', 'pharmacy', 'spare_parts', 'hardware', 'boutique', 'wholesale');

-- CreateEnum
CREATE TYPE "RecordingMode" AS ENUM ('daily_summary', 'transaction');

-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('tier1', 'tier2');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'manager', 'cashier', 'stock_manager');

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('sale', 'stock_purchase', 'expense', 'debtor_payment', 'creditor_payment', 'daily_summary', 'opening_balance', 'owner_deposit', 'owner_withdrawal', 'stock_count_adjustment');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'mtn_momo', 'telecel', 'airtel', 'bank', 'credit', 'mixed');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('rent', 'wages', 'utilities', 'transport', 'momo_charges', 'bank_charges', 'packaging', 'miscellaneous');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('asset', 'liability', 'equity', 'revenue', 'cogs', 'expense');

-- CreateEnum
CREATE TYPE "NormalBalance" AS ENUM ('debit', 'credit');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('outstanding', 'partial', 'paid');

-- CreateEnum
CREATE TYPE "StockCountType" AS ENUM ('actual', 'estimated', 'system');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('equipment', 'furniture', 'vehicle', 'other');

-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('good', 'fair', 'poor');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('pending', 'synced', 'failed', 'conflict');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('low_stock', 'debt_overdue', 'stock_count_due', 'creditor_due', 'monthly_summary_ready');

-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('pos', 'daily_form', 'manual', 'system', 'import');

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BusinessType" NOT NULL,
    "ownerName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "locationRegion" TEXT NOT NULL,
    "locationDistrict" TEXT NOT NULL,
    "recordingMode" "RecordingMode" NOT NULL,
    "tier" "Tier" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "subtype" TEXT NOT NULL,
    "normalBalance" "NormalBalance" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "entryDate" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "entryType" "EntryType" NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "source" "TransactionSource" NOT NULL,
    "paymentMethod" "PaymentMethod",
    "expenseCategory" "ExpenseCategory",
    "expenseDescription" TEXT,
    "paidTo" TEXT,
    "supplierName" TEXT,
    "customerName" TEXT,
    "cashInHandEod" DECIMAL(10,2),
    "momoBalanceEod" DECIMAL(10,2),
    "receiptPrinted" BOOLEAN NOT NULL DEFAULT false,
    "receiptSentTo" TEXT,
    "isVoid" BOOLEAN NOT NULL DEFAULT false,
    "voidReason" TEXT,
    "voidedAt" TIMESTAMP(3),
    "voidedById" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_lines" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debtors" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "amountOriginal" DECIMAL(10,2) NOT NULL,
    "amountOutstanding" DECIMAL(10,2) NOT NULL,
    "debtDate" DATE NOT NULL,
    "dueDate" DATE,
    "status" "DebtStatus" NOT NULL DEFAULT 'outstanding',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debtors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debtor_payments" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "debtorId" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "amountPaid" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentDate" DATE NOT NULL,
    "receivedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debtor_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creditors" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "supplierPhone" TEXT,
    "amountOriginal" DECIMAL(10,2) NOT NULL,
    "amountOutstanding" DECIMAL(10,2) NOT NULL,
    "debtDate" DATE NOT NULL,
    "dueDate" DATE,
    "status" "DebtStatus" NOT NULL DEFAULT 'outstanding',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creditors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creditor_payments" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "creditorId" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "amountPaid" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentDate" DATE NOT NULL,
    "paidById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creditor_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "barcode" TEXT,
    "sellingPrice" DECIMAL(10,2) NOT NULL,
    "costPrice" DECIMAL(10,2) NOT NULL,
    "currentStockQty" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "minimumStockQty" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'piece',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "unitSellingPrice" DECIMAL(10,2) NOT NULL,
    "unitCostPrice" DECIMAL(10,2) NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "lineCogs" DECIMAL(10,2) NOT NULL,
    "lineGrossProfit" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_purchase_items" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "quantity" DECIMAL(10,3),
    "unitCost" DECIMAL(10,2) NOT NULL,
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_counts" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "countDate" DATE NOT NULL,
    "stockValue" DECIMAL(10,2) NOT NULL,
    "countType" "StockCountType" NOT NULL,
    "confidenceLevel" "ConfidenceLevel" NOT NULL,
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "assetName" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "currentValue" DECIMAL(10,2) NOT NULL,
    "purchaseValue" DECIMAL(10,2),
    "purchaseDate" DATE,
    "condition" "AssetCondition",
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_queue" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "deviceId" TEXT NOT NULL,
    "createdLocallyAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3),
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'pending',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_businessId_idx" ON "users"("businessId");

-- CreateIndex
CREATE INDEX "accounts_businessId_idx" ON "accounts"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_businessId_code_key" ON "accounts"("businessId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_businessId_subtype_key" ON "accounts"("businessId", "subtype");

-- CreateIndex
CREATE INDEX "journal_entries_businessId_entryDate_idx" ON "journal_entries"("businessId", "entryDate");

-- CreateIndex
CREATE INDEX "journal_entries_businessId_entryType_idx" ON "journal_entries"("businessId", "entryType");

-- CreateIndex
CREATE INDEX "journal_lines_businessId_idx" ON "journal_lines"("businessId");

-- CreateIndex
CREATE INDEX "journal_lines_entryId_idx" ON "journal_lines"("entryId");

-- CreateIndex
CREATE INDEX "journal_lines_accountId_idx" ON "journal_lines"("accountId");

-- CreateIndex
CREATE INDEX "debtors_businessId_status_idx" ON "debtors"("businessId", "status");

-- CreateIndex
CREATE INDEX "debtor_payments_businessId_idx" ON "debtor_payments"("businessId");

-- CreateIndex
CREATE INDEX "debtor_payments_debtorId_idx" ON "debtor_payments"("debtorId");

-- CreateIndex
CREATE INDEX "creditors_businessId_status_idx" ON "creditors"("businessId", "status");

-- CreateIndex
CREATE INDEX "creditor_payments_businessId_idx" ON "creditor_payments"("businessId");

-- CreateIndex
CREATE INDEX "creditor_payments_creditorId_idx" ON "creditor_payments"("creditorId");

-- CreateIndex
CREATE INDEX "products_businessId_isActive_idx" ON "products"("businessId", "isActive");

-- CreateIndex
CREATE INDEX "product_categories_businessId_idx" ON "product_categories"("businessId");

-- CreateIndex
CREATE INDEX "sale_items_businessId_idx" ON "sale_items"("businessId");

-- CreateIndex
CREATE INDEX "sale_items_journalEntryId_idx" ON "sale_items"("journalEntryId");

-- CreateIndex
CREATE INDEX "sale_items_productId_idx" ON "sale_items"("productId");

-- CreateIndex
CREATE INDEX "stock_purchase_items_businessId_idx" ON "stock_purchase_items"("businessId");

-- CreateIndex
CREATE INDEX "stock_purchase_items_journalEntryId_idx" ON "stock_purchase_items"("journalEntryId");

-- CreateIndex
CREATE INDEX "stock_counts_businessId_countDate_idx" ON "stock_counts"("businessId", "countDate");

-- CreateIndex
CREATE INDEX "assets_businessId_isActive_idx" ON "assets"("businessId", "isActive");

-- CreateIndex
CREATE INDEX "sync_queue_businessId_syncStatus_idx" ON "sync_queue"("businessId", "syncStatus");

-- CreateIndex
CREATE INDEX "notifications_businessId_isRead_idx" ON "notifications"("businessId", "isRead");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debtors" ADD CONSTRAINT "debtors_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debtors" ADD CONSTRAINT "debtors_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debtor_payments" ADD CONSTRAINT "debtor_payments_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debtor_payments" ADD CONSTRAINT "debtor_payments_debtorId_fkey" FOREIGN KEY ("debtorId") REFERENCES "debtors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debtor_payments" ADD CONSTRAINT "debtor_payments_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debtor_payments" ADD CONSTRAINT "debtor_payments_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditors" ADD CONSTRAINT "creditors_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditors" ADD CONSTRAINT "creditors_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditor_payments" ADD CONSTRAINT "creditor_payments_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditor_payments" ADD CONSTRAINT "creditor_payments_creditorId_fkey" FOREIGN KEY ("creditorId") REFERENCES "creditors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditor_payments" ADD CONSTRAINT "creditor_payments_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditor_payments" ADD CONSTRAINT "creditor_payments_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_purchase_items" ADD CONSTRAINT "stock_purchase_items_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_purchase_items" ADD CONSTRAINT "stock_purchase_items_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_purchase_items" ADD CONSTRAINT "stock_purchase_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_queue" ADD CONSTRAINT "sync_queue_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_queue" ADD CONSTRAINT "sync_queue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
