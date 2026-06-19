import { postSale } from '@/journal/postSale';
import { CreateSaleInput } from './sales.schemas';

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