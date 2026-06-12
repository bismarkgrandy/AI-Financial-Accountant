import { Prisma } from '@prisma/client';
import { AppError } from '@/middleware/errorHandler';

export const findAccountBySubtype = async (
  tx: Prisma.TransactionClient,
  businessId: string,
  subtype: string,
) => {
  const account = await tx.account.findFirst({
    where: { businessId, subtype, isActive: true },
  });

  if (!account) {
    throw new AppError(
      `System account '${subtype}' not found for this business`,
      500,
    );
  }

  return account;
};

export const findPaymentAccount = async (
  tx: Prisma.TransactionClient,
  businessId: string,
  paymentMethod: string,
) => {
  const subtypeMap: Record<string, string> = {
    cash: 'cash_hand',
    mtn_momo: 'cash_momo_mtn',
    telecel: 'cash_momo_telecel',
    airtel: 'cash_momo_airtel',
    bank: 'cash_bank',
  };

  const subtype = subtypeMap[paymentMethod];

  if (!subtype) {
    throw new AppError(`Invalid payment method: ${paymentMethod}`, 400);
  }

  return findAccountBySubtype(tx, businessId, subtype);
};