import prisma from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { findAccountBySubtype, findPaymentAccount } from '@/utils/accountFinder';
import { generateReferenceNumber } from '@/utils/referenceNumber';


export const EXPENSE_CATEGORIES = [
  'rent',
  'wages',
  'utilities',
  'transport',
  'momo_charges',
  'bank_charges',
  'packaging',
  'other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface PostExpenseInput {
  category: ExpenseCategory;
  amount: number;
  paymentMethod: string; // cash / mtn_momo / telecel / airtel / bank
  paidTo?: string;
  notes?: string;
}

export const postExpense = async (
  businessId: string,
  userId: string,
  input: PostExpenseInput,
) => {
  if (input.paymentMethod === 'credit') {
    throw new AppError(
      'Expenses must be paid immediately (cash, MoMo, or bank), not on credit',
      400,
    );
  }

  if (input.amount <= 0) {
    throw new AppError('Expense amount must be greater than zero', 400);
  }

  return prisma.$transaction(async (tx) => {
    const expenseAccount = await findAccountBySubtype(tx, businessId, input.category);

    const moneyAccount = await findPaymentAccount(tx, businessId, input.paymentMethod);

    const description = input.paidTo
      ? `${input.category} expense — paid to ${input.paidTo}`
      : `${input.category} expense`;

    const reference = await generateReferenceNumber(tx, businessId, 'expense');
    const entry = await tx.journalEntry.create({
      data: {
        businessId,
        entryDate: new Date(),
        description,
        entryType: 'expense',
        referenceNumber: reference,
        source: 'manual',
        paymentMethod: input.paymentMethod as never,
        createdById: userId,
      },
    });

    await tx.journalLine.createMany({
      data: [
        {
          businessId, entryId: entry.id, accountId: expenseAccount.id,
          debit: input.amount, credit: 0,
          memo: `${expenseAccount.name}`,
        },
        {
          businessId, entryId: entry.id, accountId: moneyAccount.id,
          debit: 0, credit: input.amount,
          memo: 'Payment made',
        },
      ],
    });

    const expense = await tx.expense.create({
      data: {
        businessId,
        journalEntryId: entry.id,
        expenseAccountId: expenseAccount.id,
        amount: input.amount,
        paymentMethod: input.paymentMethod as never,
        paidTo: input.paidTo ?? null,   // user-filled
        notes: input.notes ?? null,     // user-filled
        createdById: userId,
      },
    });

    return {
      expenseId: expense.id,
      referenceNumber: entry.referenceNumber,
      category: input.category,
      categoryName: expenseAccount.name,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      paidTo: input.paidTo ?? null,
    };
  });
};