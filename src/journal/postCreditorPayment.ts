import prisma from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { findAccountBySubtype, findPaymentAccount } from '@/utils/accountFinder';
import { generateReferenceNumber } from '@/utils/referenceNumber';

export interface CreditorPaymentInput {
  amount: number;
  paymentMethod: string;
  notes?: string;
}

export const postCreditorPayment = async (
  businessId: string,
  userId: string,
  creditorId: string,
  input: CreditorPaymentInput,
) => {
  return prisma.$transaction(async (tx) => {
    // ── 1. Load the creditor and their OPEN payables (oldest first, FIFO) ──
    const creditor = await tx.creditor.findFirst({
      where: { id: creditorId, businessId },
    });
    if (!creditor) {
      throw new AppError('Creditor not found', 404);
    }

    const openPayables = await tx.payable.findMany({
      where: {
        creditorId,
        businessId,
        status: { in: ['outstanding', 'partial'] },
      },
      orderBy: { debtDate: 'asc' }, // FIFO — oldest payable first
    });

    // ── 2. Validate the payment against what you owe ──
    const totalOwed = openPayables.reduce(
      (sum, p) => sum + Number(p.amountOutstanding),
      0,
    );

    if (totalOwed <= 0) {
      throw new AppError('You have no outstanding debts to this supplier', 400);
    }

    if (input.amount > totalOwed) {
      throw new AppError(
        `Payment (${input.amount}) exceeds what you owe this supplier (${totalOwed}). ` +
          `You cannot pay more than you owe.`,
        400,
      );
    }

    // ── 3. Allocate the payment across payables (FIFO) ──
    let remaining = input.amount;
    const payableUpdates: { id: string; newOutstanding: number; newStatus: string }[] = [];

    for (const payable of openPayables) {
      if (remaining <= 0) break;

      const outstanding = Number(payable.amountOutstanding);
      const applied = Math.min(remaining, outstanding);
      const newOutstanding = outstanding - applied;
      remaining -= applied;

      payableUpdates.push({
        id: payable.id,
        newOutstanding,
        newStatus: newOutstanding === 0 ? 'paid' : 'partial',
      });
    }

    // ── 4. Create the journal entry header ──
    const reference = await generateReferenceNumber(tx, businessId, 'creditor_payment');
    const entry = await tx.journalEntry.create({
      data: {
        businessId,
        entryDate: new Date(),
        description: 'Creditor payment',
        entryType: 'creditor_payment',
        referenceNumber: reference,
        source: 'manual',
        paymentMethod: input.paymentMethod as never,
        createdById: userId,
      },
    });

    // ── 5. Journal lines — Creditors DOWN, money OUT ──
    // (the OPPOSITE of a debtor payment: you're paying out, not receiving)
    const creditorsAccount = await findAccountBySubtype(tx, businessId, 'creditors');
    const moneyAccount = await findPaymentAccount(tx, businessId, input.paymentMethod);

    await tx.journalLine.createMany({
      data: [
        {
          businessId, entryId: entry.id, accountId: creditorsAccount.id,
          debit: input.amount, credit: 0, memo: 'Reduction in amount owed to supplier',
        },
        {
          businessId, entryId: entry.id, accountId: moneyAccount.id,
          debit: 0, credit: input.amount, memo: 'Payment made to supplier',
        },
      ],
    });

    // ── 6. Record the payment ──
    await tx.creditorPayment.create({
      data: {
        businessId,
        creditorId,
        journalEntryId: entry.id,
        amountPaid: input.amount,
        paymentMethod: input.paymentMethod as never,
        paymentDate: new Date(),
        paidById: userId,
        notes: input.notes ?? null,
      },
    });

    // ── 7. Apply the allocation to each payable ──
    for (const u of payableUpdates) {
      await tx.payable.update({
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
      payablesAffected: payableUpdates.length,
      payablesClearedCount: payableUpdates.filter((p) => p.newStatus === 'paid').length,
      remainingOwed: newTotalOwed,
    };
  });
};