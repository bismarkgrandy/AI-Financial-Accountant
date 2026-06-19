import { Prisma } from '@prisma/client';
import prisma from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { findAccountBySubtype, findPaymentAccount } from '@/utils/accountFinder';
import { generateReferenceNumber } from '@/utils/referenceNumber';

export interface PurchaseItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface PostPurchaseInput {
  paymentMethod: string;
  items: PurchaseItemInput[];
  creditorId?: string;
  supplierName?: string;
  supplierPhone?: string;
  dueDate?: string;
  notes?: string;
}

export const postPurchase = async (
  businessId: string,
  userId: string,
  input: PostPurchaseInput,
) => {
  const isCredit = input.paymentMethod === 'credit';

  // Credit purchases must identify the supplier
  if (isCredit) {
    const hasExisting = !!input.creditorId;
    const hasNew = !!input.supplierName && input.supplierName.trim().length > 0;
    if (!hasExisting && !hasNew) {
      throw new AppError(
        'Credit purchases require a supplier: select an existing one or provide a name',
        400,
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    // ── 1. Load the products being purchased ──
    const productIds = input.items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, businessId, isActive: true },
    });
    if (products.length !== productIds.length) {
      throw new AppError('One or more products were not found or are inactive', 404);
    }
    const productMap = new Map(products.map((p) => [p.id, p]));

    // ── 2. Calculate totals + the new weighted-average cost per product ──
    let totalPurchaseValue = 0;
    const purchaseItemsData: Prisma.StockPurchaseItemCreateManyInput[] = [];
    const productUpdates: {
      id: string;
      newQty: number;
      newAvgCost: number;
      lastCost: number;
    }[] = [];

    for (const item of input.items) {
      const product = productMap.get(item.productId)!;

      const oldQty = Number(product.currentStockQty);
      const oldCost = Number(product.costPrice);
      const buyQty = item.quantity;
      const buyCost = item.unitCost;

      const lineTotal = buyCost * buyQty;
      totalPurchaseValue += lineTotal;

      // WEIGHTED AVERAGE: blend old stock value with new stock value
      // newAvgCost = (oldQty×oldCost + buyQty×buyCost) / (oldQty + buyQty)
      const newQty = oldQty + buyQty;
      const newAvgCost =
        newQty > 0
          ? (oldQty * oldCost + buyQty * buyCost) / newQty
          : buyCost;

      productUpdates.push({
        id: product.id,
        newQty,
        newAvgCost,
        lastCost: buyCost,
      });

      purchaseItemsData.push({
        businessId,
        journalEntryId: '',
        productId: product.id,
        productName: product.name,
        quantity: buyQty,
        unitCost: buyCost,
        lineTotal,
      });
    }

    // ── 3. For credit: resolve the supplier (find-or-create) ──
    let creditorId: string | null = null;

    if (isCredit) {
      if (input.creditorId) {
        const creditor = await tx.creditor.findFirst({
          where: { id: input.creditorId, businessId, isActive: true },
        });
        if (!creditor) {
          throw new AppError('Selected supplier not found', 404);
        }
        creditorId = creditor.id;
      } else {
        const creditor = await tx.creditor.create({
          data: {
            businessId,
            name: input.supplierName!.trim(),
            phone: input.supplierPhone ?? null,
          },
        });
        creditorId = creditor.id;
      }
    }

    // ── 4. Create the journal entry header ──
    const reference = await generateReferenceNumber(tx, businessId, 'stock_purchase');
    const entry = await tx.journalEntry.create({
      data: {
        businessId,
        entryDate: new Date(),
        description: isCredit ? 'Credit purchase' : 'Stock purchase',
        entryType: 'stock_purchase',
        referenceNumber: reference,
        source: 'manual',
        paymentMethod: input.paymentMethod as never,
        createdById: userId,
      },
    });

    // ── 5. Build the 2 journal lines ──
    // DEBIT Stock (inventory up), CREDIT money/creditors (money out / owed)
    const stockAccount = await findAccountBySubtype(tx, businessId, 'stock');
    const moneyAccount = isCredit
      ? await findAccountBySubtype(tx, businessId, 'creditors')
      : await findPaymentAccount(tx, businessId, input.paymentMethod);

    await tx.journalLine.createMany({
      data: [
        {
          businessId, entryId: entry.id, accountId: stockAccount.id,
          debit: totalPurchaseValue, credit: 0, memo: 'Stock purchased',
        },
        {
          businessId, entryId: entry.id, accountId: moneyAccount.id,
          debit: 0, credit: totalPurchaseValue,
          memo: isCredit ? 'Amount owed to supplier' : 'Payment made',
        },
      ],
    });

    // ── 6. Create stock_purchase_items ──
    await tx.stockPurchaseItem.createMany({
      data: purchaseItemsData.map((pi) => ({ ...pi, journalEntryId: entry.id })),
    });

    // ── 7. Update each product: stock UP, weighted-avg cost, last cost ──
    for (const u of productUpdates) {
      await tx.product.update({
        where: { id: u.id },
        data: {
          currentStockQty: u.newQty,
          costPrice: u.newAvgCost,       // weighted average (drives COGS/profit)
          lastPurchaseCost: u.lastCost,  // most recent cost (display for pricing)
        },
      });
    }

    // ── 8. Credit only: create the PAYABLE under the creditor ──
    if (isCredit && creditorId) {
      await tx.payable.create({
        data: {
          businessId,
          creditorId,
          journalEntryId: entry.id,
          amountOriginal: totalPurchaseValue,
          amountOutstanding: totalPurchaseValue,
          debtDate: new Date(),
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          status: 'outstanding',
        },
      });
    }

    return {
      referenceNumber: entry.referenceNumber,
      totalPurchaseValue,
      itemCount: input.items.length,
      isCredit,
      creditorId,
    };
  });
};