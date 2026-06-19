import prisma from '@/config/database';
import { postExpense } from '@/journal/postExpense';
import { CreateExpenseInput } from './expenses.schemas';

export const createExpense = async (
  businessId: string,
  userId: string,
  input: CreateExpenseInput,
) => {
  return postExpense(businessId, userId, input);
};

export const listExpenses = async (
  businessId: string,
  filters: { category?: string; from?: string; to?: string },
) => {
  const expenses = await prisma.expense.findMany({
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
    orderBy: { createdAt: 'desc' },
    include: {
      expenseAccount: true,
      journalEntry: { select: { referenceNumber: true, isVoid: true } },
    },
  });

  // Category comes from the linked expense account's subtype (derived)
  const shaped = expenses
    .filter((e) => !e.journalEntry.isVoid)
    .map((e) => ({
      id: e.id,
      referenceNumber: e.journalEntry.referenceNumber,
      date: e.createdAt,
      category: e.expenseAccount.subtype,   // derived from the account
      categoryName: e.expenseAccount.name,
      amount: Number(e.amount),
      paymentMethod: e.paymentMethod,
      paidTo: e.paidTo,
      notes: e.notes,
    }));

  const filtered = filters.category
    ? shaped.filter((e) => e.category === filters.category)
    : shaped;

  const totalSpent = filtered.reduce((sum, e) => sum + e.amount, 0);

  return { expenses: filtered, totalSpent, count: filtered.length };
};