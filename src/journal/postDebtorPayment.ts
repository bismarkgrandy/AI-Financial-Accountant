import prisma from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { findAccountBySubtype, findPaymentAccount } from '@/utils/accountFinder';
import { generateReferenceNumber } from '@/utils/referenceNumber';

export interface DebtorPaymentInput {
  amount: number;
  paymentMethod: string;
  notes?: string;
}

export const postDebtorPayment = async (
  businessId: string,
  userId: string,
  debtorId: string,
  input: DebtorPaymentInput,
) => {
  return prisma.$transaction(async (tx) => {
    // ── 1. Load the debtor and their OPEN debts (oldest first for FIFO) ──
    const debtor = await tx.debtor.findFirst({
      where: { id: debtorId, businessId },
    });
    if (!debtor) {
      throw new AppError('Debtor not found', 404);
    }

    const openDebts = await tx.debt.findMany({
      where: {
        debtorId,
        businessId,
        status: { in: ['outstanding', 'partial'] },
      },
      orderBy: { debtDate: 'asc' }, // FIFO — oldest debt first
    });

    // ── 2. Validate the payment amount against what's owed ──
    const totalOwed = openDebts.reduce(
      (sum, d) => sum + Number(d.amountOutstanding),
      0,
    );

    if (totalOwed <= 0) {
      throw new AppError('This customer has no outstanding debts', 400);
    }

    if (input.amount > totalOwed) {
      throw new AppError(
        `Payment (${input.amount}) exceeds what this customer owes (${totalOwed}). ` +
          `They cannot pay more than they owe.`,
        400,
      );
    }

    // ── 3. Allocate the payment across debts (FIFO) ──
    let remaining = input.amount;
    const debtUpdates: { id: string; newOutstanding: number; newStatus: string }[] = [];

    for (const debt of openDebts) {
      if (remaining <= 0) break;

      const outstanding = Number(debt.amountOutstanding);
      const applied = Math.min(remaining, outstanding);
      const newOutstanding = outstanding - applied;
      remaining -= applied;

      debtUpdates.push({
        id: debt.id,
        newOutstanding,
        newStatus: newOutstanding === 0 ? 'paid' : 'partial',
      });
    }

    // ── 4. Create the journal entry header ──
    const reference = await generateReferenceNumber(tx, businessId, 'debtor_payment');
    const entry = await tx.journalEntry.create({
      data: {
        businessId,
        entryDate: new Date(),
        description: 'Debtor payment',
        entryType: 'debtor_payment',
        referenceNumber: reference,
        source: 'manual',
        paymentMethod: input.paymentMethod as never,
        createdById: userId,
      },
    });

    // ── 5. Journal lines — money IN, Debtors DOWN ──
    const moneyAccount = await findPaymentAccount(tx, businessId, input.paymentMethod);
    const debtorsAccount = await findAccountBySubtype(tx, businessId, 'debtors');

    await tx.journalLine.createMany({
      data: [
        {
          businessId, entryId: entry.id, accountId: moneyAccount.id,
          debit: input.amount, credit: 0, memo: 'Payment received from customer',
        },
        {
          businessId, entryId: entry.id, accountId: debtorsAccount.id,
          debit: 0, credit: input.amount, memo: 'Reduction in amount owed',
        },
      ],
    });

    // ── 6. Record the payment ──
    await tx.debtorPayment.create({
      data: {
        businessId,
        debtorId,
        journalEntryId: entry.id,
        amountPaid: input.amount,
        paymentMethod: input.paymentMethod as never,
        paymentDate: new Date(),
        receivedById: userId,
        notes: input.notes ?? null,
      },
    });

    // ── 7. Apply the allocation to each debt ──
    for (const u of debtUpdates) {
      await tx.debt.update({
        where: { id: u.id },
        data: {
          amountOutstanding: u.newOutstanding,
          status: u.newStatus as never,
        },
      });
    }

    const newTotalOwed = totalOwed - input.amount;

    return {
      referenceNumber: entry.referenceNumber,
      amountPaid: input.amount,
      debtsAffected: debtUpdates.length,
      debtsClearedCount: debtUpdates.filter((d) => d.newStatus === 'paid').length,
      remainingOwed: newTotalOwed,
    };
  });
};