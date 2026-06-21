import prisma from '@/config/database';

// Compute the default range: start of the current month → today
const getDefaultRange = (): { from: Date; to: Date } => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of this month
  const to = now;
  return { from, to };
};

// Parse a YYYY-MM-DD string to a Date, or use the default
const resolveRange = (
  fromStr?: string,
  toStr?: string,
): { from: Date; to: Date } => {
  const def = getDefaultRange();
  return {
    from: fromStr ? new Date(fromStr) : def.from,
    to: toStr ? new Date(toStr) : def.to,
  };
};

// Round to 2 decimals (money) — shared by the reports below
const round = (n: number) => Math.round(n * 100) / 100;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysBetween = (from: Date, to: Date) =>
  Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

// Sort: overdue first, then soonest due date, then no-due-date last
const sortByUrgency = <T extends { dueDate: Date | null; isOverdue: boolean }>(
  list: T[],
) => {
  return list.sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    return 0;
  });
};

export const getProfitLoss = async (
  businessId: string,
  filters: { from?: string; to?: string },
) => {
  const { from, to } = resolveRange(filters.from, filters.to);

  const lines = await prisma.journalLine.findMany({
    where: {
      businessId,
      entry: {
        isVoid: false,
        entryDate: { gte: from, lte: to },
      },
    },
    include: {
      account: { select: { type: true, subtype: true, name: true } },
    },
  });

  let revenue = 0;
  let cogs = 0;
  let expensesTotal = 0;
  const expenseBreakdown: Record<string, { name: string; amount: number }> = {};

  for (const line of lines) {
    const debit = Number(line.debit);
    const credit = Number(line.credit);
    const { type, subtype, name } = line.account;

    if (type === 'revenue') {
      revenue += credit - debit;
    } else if (type === 'cogs') {
      cogs += debit - credit;
    } else if (type === 'expense') {
      const amount = debit - credit;
      expensesTotal += amount;
      if (!expenseBreakdown[subtype]) {
        expenseBreakdown[subtype] = { name, amount: 0 };
      }
      expenseBreakdown[subtype].amount += amount;
    }
  }

  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - expensesTotal;

  return {
    period: {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    },
    revenue: round(revenue),
    cogs: round(cogs),
    grossProfit: round(grossProfit),
    expenses: round(expensesTotal),
    netProfit: round(netProfit),
    expenseBreakdown: Object.entries(expenseBreakdown)
      .map(([category, v]) => ({
        category,
        name: v.name,
        amount: round(v.amount),
      }))
      .filter((e) => e.amount !== 0)
      .sort((a, b) => b.amount - a.amount), // biggest expense first
  };
};

// The money accounts that make up "cash on hand" — by subtype.
const MONEY_SUBTYPES = [
  'cash_hand',
  'cash_momo_mtn',
  'cash_momo_telecel',
  'cash_momo_airtel',
  'cash_bank',
] as const;

export const getCashPosition = async (businessId: string) => {
  // All journal lines hitting the money accounts, non-voided, all time.
  // (No date range — cash position is the CURRENT balance, which means
  // everything from the opening balance forward.)
  const lines = await prisma.journalLine.findMany({
    where: {
      businessId,
      entry: { isVoid: false },
      account: { subtype: { in: [...MONEY_SUBTYPES] } },
    },
    include: {
      account: { select: { subtype: true, name: true } },
    },
  });

  // Sum debit − credit per account (money accounts are debit-natured:
  // money in = debit raises it, money out = credit lowers it).
  const balances: Record<string, { name: string; balance: number }> = {};

  for (const line of lines) {
    const { subtype, name } = line.account;
    if (!balances[subtype]) {
      balances[subtype] = { name, balance: 0 };
    }
    balances[subtype].balance += Number(line.debit) - Number(line.credit);
  }

  // Build the per-account list — include every money account, even 0,
  // so the frontend always shows all of them in a consistent order.
  const accounts = MONEY_SUBTYPES.map((subtype) => ({
    subtype,
    name: balances[subtype]?.name ?? subtype,
    balance: round(balances[subtype]?.balance ?? 0),
  }));

  const total = round(accounts.reduce((sum, a) => sum + a.balance, 0));

  return {
    asOf: new Date().toISOString(),
    total,
    accounts,
  };
};

interface DebtorAccumulator {
  id: string;
  name: string;
  phone: string | null;
  amountOutstanding: number;
  earliestDueDate: Date | null;
  debtCount: number;
}

export const getDebtorsSummary = async (businessId: string) => {
  const today = startOfToday();

  // Read the actual DEBTS (unpaid), with the debtor contact attached.
  const debts = await prisma.debt.findMany({
    where: { businessId, status: { not: 'paid' } },
    include: { debtor: { select: { id: true, name: true, phone: true } } },
  });

  // Group by debtor — one row per person, summing their unpaid debts.
  const byDebtor: Record<string, DebtorAccumulator> = {};

  for (const debt of debts) {
    const key = debt.debtor.id;
    if (!byDebtor[key]) {
      byDebtor[key] = {
        id: debt.debtor.id,
        name: debt.debtor.name,
        phone: debt.debtor.phone,
        amountOutstanding: 0,
        earliestDueDate: null,
        debtCount: 0,
      };
    }
    const row = byDebtor[key];
    row.amountOutstanding += Number(debt.amountOutstanding);
    row.debtCount += 1;
    if (debt.dueDate) {
      if (!row.earliestDueDate || debt.dueDate < row.earliestDueDate) {
        row.earliestDueDate = debt.dueDate;
      }
    }
  }

  const items = Object.values(byDebtor).map((row) => {
    const dueDate = row.earliestDueDate;
    const isOverdue = !!dueDate && dueDate < today;
    const isDueSoon =
      !!dueDate && !isOverdue && daysBetween(today, dueDate) <= 7;
    return {
      debtorId: row.id,
      name: row.name,
      phone: row.phone,
      amountOutstanding: round(row.amountOutstanding),
      dueDate,
      debtCount: row.debtCount,
      isOverdue,
      isDueSoon,
    };
  });

  sortByUrgency(items);

  const totalOwed = round(
    items.reduce((sum, i) => sum + i.amountOutstanding, 0),
  );
  const overdueCount = items.filter((i) => i.isOverdue).length;

  return {
    totalOwed,
    count: items.length,
    overdueCount,
    debtors: items,
  };
};

interface CreditorAccumulator {
  id: string;
  name: string;
  phone: string | null;
  amountOutstanding: number;
  earliestDueDate: Date | null;
  payableCount: number;
}

export const getCreditorsSummary = async (businessId: string) => {
  const today = startOfToday();

  // Read the actual PAYABLES (unpaid), with the creditor contact attached.
  const payables = await prisma.payable.findMany({
    where: { businessId, status: { not: 'paid' } },
    include: { creditor: { select: { id: true, name: true, phone: true } } },
  });

  // Group by creditor — one row per supplier, summing their unpaid payables.
  const byCreditor: Record<string, CreditorAccumulator> = {};

  for (const payable of payables) {
    const key = payable.creditor.id;
    if (!byCreditor[key]) {
      byCreditor[key] = {
        id: payable.creditor.id,
        name: payable.creditor.name,
        phone: payable.creditor.phone,
        amountOutstanding: 0,
        earliestDueDate: null,
        payableCount: 0,
      };
    }
    const row = byCreditor[key];
    row.amountOutstanding += Number(payable.amountOutstanding);
    row.payableCount += 1;
    if (payable.dueDate) {
      if (!row.earliestDueDate || payable.dueDate < row.earliestDueDate) {
        row.earliestDueDate = payable.dueDate;
      }
    }
  }

  const items = Object.values(byCreditor).map((row) => {
    const dueDate = row.earliestDueDate;
    const isOverdue = !!dueDate && dueDate < today;
    const isDueSoon =
      !!dueDate && !isOverdue && daysBetween(today, dueDate) <= 7;
    return {
      creditorId: row.id,
      name: row.name,
      phone: row.phone,
      amountOutstanding: round(row.amountOutstanding),
      dueDate,
      payableCount: row.payableCount,
      isOverdue,
      isDueSoon,
    };
  });

  sortByUrgency(items);

  const totalOwed = round(
    items.reduce((sum, i) => sum + i.amountOutstanding, 0),
  );
  const overdueCount = items.filter((i) => i.isOverdue).length;

  return {
    totalOwed,
    count: items.length,
    overdueCount,
    creditors: items,
  };
};