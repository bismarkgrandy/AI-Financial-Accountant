// import prisma from '@/config/database';
// import { EntryType } from '@/types';

// const prefixMap: Record<EntryType, string> = {
//   sale: 'RCP',
//   stock_purchase: 'PUR',
//   expense: 'EXP',
//   debtor_payment: 'DPY',
//   creditor_payment: 'CPY',
//   owner_deposit: 'DEP',
//   owner_withdrawal: 'WDR',
//   daily_summary: 'DLY',
//   opening_balance: 'OPB',
//   stock_count_adjustment: 'STK',
// };

// export const generateReferenceNumber = async (
//   businessId: string,
//   entryType: EntryType,
// ): Promise<string> => {
//   const prefix = prefixMap[entryType] ?? 'TXN';
//   const year = new Date().getFullYear();

//   const count = await prisma.journalEntry.count({
//     where: { businessId, entryType },
//   });

//   const sequence = String(count + 1).padStart(5, '0');
//   return `${prefix}-${year}-${sequence}`;
// };
