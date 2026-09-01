import { Prisma } from '@prisma/client';
import prisma from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { createAuditLog } from '@/modules/audit/audit.service';
import {
  findAccountBySubtype,
  findPaymentAccount,
} from '@/utils/accountFinder';
import { generateReferenceNumber } from '@/utils/referenceNumber';

export interface SaleItemInput {
  productId: string;
  quantity: number;
}

export interface PostSaleInput {
  paymentMethod: string;
  items: SaleItemInput[];
  debtorId?: string;
  customerName?: string;
  customerPhone?: string;
  dueDate?: string;
}

export const postSale = async (
  businessId: string,
  userId: string,
  input: PostSaleInput,
) => {
  const isCredit = input.paymentMethod === 'credit';

  if (isCredit) {
    const hasExisting = !!input.debtorId;
    const hasNew = !!input.customerName && input.customerName.trim().length > 0;
    if (!hasExisting && !hasNew) {
      throw new AppError(
        'Credit sales require a customer: select an existing one or provide a name',
        400,
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    // 1. Load products
    const productIds = input.items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, businessId, isActive: true },
    });
    if (products.length !== productIds.length) {
      throw new AppError(
        'One or more products were not found or are inactive',
        404,
      );
    }
    const productMap = new Map(products.map((p) => [p.id, p]));

    // 2. Calculate totals + check stock
    let totalRevenue = 0;
    let totalCogs = 0;
    const saleItemsRaw: Omit<
      Prisma.SaleItemCreateManyInput,
      'saleId' | 'journalEntryId'
    >[] = [];
    const stockUpdates: { id: string; newQty: number }[] = [];

    for (const item of input.items) {
      const product = productMap.get(item.productId)!;
      const sellingPrice = Number(product.sellingPrice);
      const costPrice = Number(product.costPrice);
      const currentStock = Number(product.currentStockQty);

      if (item.quantity > currentStock) {
        throw new AppError(
          `Not enough stock for ${product.name}. Available: ${currentStock}, requested: ${item.quantity}.`,
          400,
        );
      }

      const lineTotal = sellingPrice * item.quantity;
      const lineCogs = costPrice * item.quantity;
      totalRevenue += lineTotal;
      totalCogs += lineCogs;

      saleItemsRaw.push({
        businessId,
        productId: product.id,
        productName: product.name,
        unitSellingPrice: sellingPrice,
        unitCostPrice: costPrice,
        quantity: item.quantity,
        lineTotal,
        lineCogs,
        lineGrossProfit: lineTotal - lineCogs,
      });
      stockUpdates.push({
        id: product.id,
        newQty: currentStock - item.quantity,
      });
    }

    // 3. Resolve debtor (credit only)
    let debtorId: string | null = null;
    if (isCredit) {
      if (input.debtorId) {
        const debtor = await tx.debtor.findFirst({
          where: { id: input.debtorId, businessId, isActive: true },
        });
        if (!debtor) throw new AppError('Selected customer not found', 404);
        debtorId = debtor.id;
      } else {
        const debtor = await tx.debtor.create({
          data: {
            businessId,
            name: input.customerName!.trim(),
            phone: input.customerPhone ?? null,
          },
        });
        debtorId = debtor.id;
      }
    }

    // 4. Journal entry header (NO customerName/receipt fields now)
    const reference = await generateReferenceNumber(tx, businessId, 'sale');
    const entry = await tx.journalEntry.create({
      data: {
        businessId,
        entryDate: new Date(),
        description: isCredit ? 'Credit sale' : 'Sale',
        entryType: 'sale',
        referenceNumber: reference,
        source: 'pos',
        paymentMethod: input.paymentMethod as never,
        createdById: userId,
      },
    });

    // 5. The 4 journal lines
    const moneyAccount = isCredit
      ? await findAccountBySubtype(tx, businessId, 'debtors')
      : await findPaymentAccount(tx, businessId, input.paymentMethod);
    const salesAccount = await findAccountBySubtype(tx, businessId, 'sales');
    const cogsAccount = await findAccountBySubtype(tx, businessId, 'cogs');
    const stockAccount = await findAccountBySubtype(tx, businessId, 'stock');

    await tx.journalLine.createMany({
      data: [
        {
          businessId,
          entryId: entry.id,
          accountId: moneyAccount.id,
          debit: totalRevenue,
          credit: 0,
          memo: isCredit ? 'Amount owed by customer' : 'Payment received',
        },
        {
          businessId,
          entryId: entry.id,
          accountId: salesAccount.id,
          debit: 0,
          credit: totalRevenue,
          memo: 'Sales revenue',
        },
        {
          businessId,
          entryId: entry.id,
          accountId: cogsAccount.id,
          debit: totalCogs,
          credit: 0,
          memo: 'Cost of goods sold',
        },
        {
          businessId,
          entryId: entry.id,
          accountId: stockAccount.id,
          debit: 0,
          credit: totalCogs,
          memo: 'Stock reduction',
        },
      ],
    });

    // 6. Create the SALE header row (NEW)
    const sale = await tx.sale.create({
      data: {
        businessId,
        journalEntryId: entry.id,
        isCredit,
        totalRevenue,
        totalCogs,
        grossProfit: totalRevenue - totalCogs,
        debtorId,
        createdById: userId,
      },
    });

    // 7. Create sale_items, linked to the SALE (and the entry)
    await tx.saleItem.createMany({
      data: saleItemsRaw.map((si) => ({
        ...si,
        saleId: sale.id,
        journalEntryId: entry.id,
      })),
    });

    // 8. Reduce stock
    for (const u of stockUpdates) {
      await tx.product.update({
        where: { id: u.id },
        data: { currentStockQty: u.newQty },
      });
    }

    // 9. Credit: create the debt
    if (isCredit && debtorId) {
      await tx.debt.create({
        data: {
          businessId,
          debtorId,
          journalEntryId: entry.id,
          amountOriginal: totalRevenue,
          amountOutstanding: totalRevenue,
          debtDate: new Date(),
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          status: 'outstanding',
        },
      });
    }

    await createAuditLog(tx, {
      businessId,
      actorId: userId,
      entity: 'sale',
      entityId: sale.id,
      action: 'created',
      referenceNumber: reference,
      summary: `Employee created sale ${reference}`,
      details: {
        paymentMethod: input.paymentMethod,
        totalRevenue,
        totalCogs,
        grossProfit: totalRevenue - totalCogs,
        isCredit,
        itemCount: input.items.length,
      },
    });

    return {
      entry,
      saleId: sale.id,
      totalRevenue,
      totalCogs,
      grossProfit: totalRevenue - totalCogs,
      itemCount: input.items.length,
      isCredit,
      debtorId,
    };
  });
};
