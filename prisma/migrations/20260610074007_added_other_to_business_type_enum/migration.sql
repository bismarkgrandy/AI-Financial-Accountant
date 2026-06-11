-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BusinessType" ADD VALUE 'cosmetics';
ALTER TYPE "BusinessType" ADD VALUE 'electronics';
ALTER TYPE "BusinessType" ADD VALUE 'stationery';
ALTER TYPE "BusinessType" ADD VALUE 'phone_accessories';
ALTER TYPE "BusinessType" ADD VALUE 'other';
