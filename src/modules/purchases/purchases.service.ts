import { postPurchase } from '@/journal/postPurchase';
import { CreatePurchaseInput } from './purchases.schemas';

export const createPurchase = async (
  businessId: string,
  userId: string,
  input: CreatePurchaseInput,
) => {
  const result = await postPurchase(businessId, userId, {
    paymentMethod: input.paymentMethod,
    items: input.items,
    creditorId: input.creditorId,
    supplierName: input.supplierName,
    supplierPhone: input.supplierPhone,
    dueDate: input.dueDate,
    notes: input.notes,
  });

  return result;
};