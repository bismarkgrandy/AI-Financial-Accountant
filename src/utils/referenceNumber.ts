import { Prisma } from '@prisma/client';

const prefixMap: Record<string, string> = {
  sale: 'RCP',
  stock_purchase: 'PUR',
  expense: 'EXP',
  debtor_payment: 'DPY',
  creditor_payment: 'CPY',
  owner_deposit: 'DEP',
  owner_withdrawal: 'WDR',
  daily_summary: 'DLY',
  opening_balance: 'OPB',
  stock_count_adjustment: 'STK',
};

export const generateReferenceNumber = async (
  tx: Prisma.TransactionClient,
  businessId: string,
  entryType: string,
): Promise<string> => {
  const prefix = prefixMap[entryType] ?? 'TXN';
  const year = new Date().getFullYear();

  const count = await tx.journalEntry.count({
    where: { businessId, entryType: entryType as never },
  });

  const sequence = String(count + 1).padStart(5, '0');
  return `${prefix}-${year}-${sequence}`;
};