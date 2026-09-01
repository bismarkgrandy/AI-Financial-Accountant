import prisma from '@/config/database';
import { postSale } from '@/journal/postSale';
import { CreateSaleInput, ListSalesQuery } from './sales.schemas';

export const listSales = async (
  businessId: string,
  filters: ListSalesQuery,
) => {
  const sales = await prisma.sale.findMany({
    where: {
      businessId,
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {}),
    },
    include: {
      debtor: { select: { id: true, name: true } },
      createdBy: { select: { fullName: true } },
      saleItems: {
        select: {
          productName: true,
          quantity: true,
          unitSellingPrice: true,
          lineTotal: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: (filters.page - 1) * filters.limit,
    take: filters.limit,
  });

  const shaped = sales.map((sale) => ({
    id: sale.id,
    date: sale.createdAt,
    referenceNumber: sale.journalEntryId,
    totalRevenue: Number(sale.totalRevenue),
    totalCogs: Number(sale.totalCogs),
    grossProfit: Number(sale.grossProfit),
    isCredit: sale.isCredit,
    customer: sale.debtor
      ? { id: sale.debtor.id, name: sale.debtor.name }
      : null,
    createdBy: sale.createdBy?.fullName ?? null,
    itemCount: sale.saleItems.length,
    items: sale.saleItems.map((item) => ({
      productName: item.productName,
      quantity: Number(item.quantity),
      unitSellingPrice: Number(item.unitSellingPrice),
      lineTotal: Number(item.lineTotal),
    })),
  }));

  return {
    sales: shaped,
    count: shaped.length,
    totalRevenue: shaped.reduce((sum, sale) => sum + sale.totalRevenue, 0),
  };
};

export const createSale = async (
  businessId: string,
  userId: string,
  input: CreateSaleInput,
) => {
  const result = await postSale(businessId, userId, {
    paymentMethod: input.paymentMethod,
    items: input.items,
    debtorId: input.debtorId,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    dueDate: input.dueDate,
  });

  return {
    referenceNumber: result.entry.referenceNumber,
    saleId: result.saleId,
    totalRevenue: result.totalRevenue,
    totalCogs: result.totalCogs,
    grossProfit: result.grossProfit,
    itemCount: result.itemCount,
    isCredit: result.isCredit,
    debtorId: result.debtorId,
  };
};
