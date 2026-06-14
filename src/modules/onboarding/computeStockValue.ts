import { Prisma } from '@prisma/client';


export const computeStockValueFromCatalogue = async (
  tx: Prisma.TransactionClient,
  businessId: string,
): Promise<number> => {
  const products = await tx.product.findMany({
    where: { businessId, isActive: true },
    select: { costPrice: true, currentStockQty: true },
  });

  const total = products.reduce((sum, p) => {
    const cost = Number(p.costPrice);
    const qty = Number(p.currentStockQty);
    return sum + cost * qty;
  }, 0);

  return total;
};


export const countActiveProducts = async (
  tx: Prisma.TransactionClient,
  businessId: string,
): Promise<number> => {
  return tx.product.count({
    where: { businessId, isActive: true },
  });
};