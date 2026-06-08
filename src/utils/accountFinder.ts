// import prisma from '@/config/database';
// import { AppError } from '@/middleware/errorHandler';
// import { AccountSubtype } from '@/types';

// export const findAccountBySubtype = async (
//   businessId: string,
//   subtype: AccountSubtype,
// ) => {
//   const account = await prisma.account.findFirst({
//     where: { businessId, subtype, isActive: true },
//   });

//   if (!account) {
//     throw new AppError(
//       `System account '${subtype}' not found. Please contact support.`,
//       500,
//     );
//   }

//   return account;
// };

// export const findPaymentAccount = async (
//   businessId: string,
//   paymentMethod: string,
// ) => {
//   const subtypeMap: Record<string, AccountSubtype> = {
//     cash: 'cash_hand',
//     mtn_momo: 'cash_momo_mtn',
//     telecel: 'cash_momo_telecel',
//     airtel: 'cash_momo_airtel',
//     bank: 'cash_bank',
//   };

//   const subtype = subtypeMap[paymentMethod];

//   if (!subtype) {
//     throw new AppError(`Invalid payment method: ${paymentMethod}`, 400);
//   }

//   return findAccountBySubtype(businessId, subtype);
// };
