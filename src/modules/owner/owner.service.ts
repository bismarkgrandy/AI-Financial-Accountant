import prisma from '@/config/database';
import { postOwnerDeposit, postOwnerWithdrawal } from '@/journal/postOwnerEquity';
import { OwnerEquityInput } from './owner.schemas';

export const recordDeposit = async (
  businessId: string,
  userId: string,
  input: OwnerEquityInput,
) => {
  return postOwnerDeposit(businessId, userId, input);
};

export const recordWithdrawal = async (
  businessId: string,
  userId: string,
  input: OwnerEquityInput,
) => {
  return postOwnerWithdrawal(businessId, userId, input);
};

const listOwnerEntries = async (
  businessId: string,
  entryType: 'owner_deposit' | 'owner_withdrawal',
  filters: { from?: string; to?: string },
) => {
  const entries = await prisma.journalEntry.findMany({
    where: {
      businessId,
      entryType,
      isVoid: false,
      ...(filters.from || filters.to
        ? {
            entryDate: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { entryDate: 'desc' },
    include: {
      journalLines: { include: { account: true } },
    },
  });

  const round = (n: number) => Math.round(n * 100) / 100;

  const items = entries.map((entry) => {
    const equityLine = entry.journalLines.find(
      (l) => l.account.type === 'equity',
    );
    const moneyLine = entry.journalLines.find(
      (l) => l.account.type === 'asset',
    );

    const amount =
      entryType === 'owner_deposit'
        ? Number(moneyLine?.debit ?? 0)
        : Number(moneyLine?.credit ?? 0);

    return {
      id: entry.id,
      referenceNumber: entry.referenceNumber,
      date: entry.entryDate,
      amount: round(amount),
      paymentMethod: entry.paymentMethod,
      moneyAccount: moneyLine?.account.name ?? null,
      notes: equityLine?.memo ?? null, // the user note lives on the equity line memo
    };
  });

  const total = round(items.reduce((sum, i) => sum + i.amount, 0));

  return { items, total, count: items.length };
};

export const listDeposits = async (
  businessId: string,
  filters: { from?: string; to?: string },
) => {
  const { items, total, count } = await listOwnerEntries(
    businessId,
    'owner_deposit',
    filters,
  );
  return { deposits: items, totalDeposited: total, count };
};

export const listWithdrawals = async (
  businessId: string,
  filters: { from?: string; to?: string },
) => {
  const { items, total, count } = await listOwnerEntries(
    businessId,
    'owner_withdrawal',
    filters,
  );
  return { withdrawals: items, totalWithdrawn: total, count };
};