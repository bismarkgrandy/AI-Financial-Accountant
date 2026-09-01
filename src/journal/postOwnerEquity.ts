import prisma from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { createAuditLog } from '@/modules/audit/audit.service';
import {
  findAccountBySubtype,
  findPaymentAccount,
} from '@/utils/accountFinder';
import { generateReferenceNumber } from '@/utils/referenceNumber';

export interface OwnerEquityInput {
  amount: number;
  paymentMethod: string; // cash / mtn_momo / telecel / airtel / bank
  notes?: string;
}

// ── OWNER DEPOSIT: owner puts personal money INTO the business ──
export const postOwnerDeposit = async (
  businessId: string,
  userId: string,
  input: OwnerEquityInput,
) => {
  if (input.paymentMethod === 'credit') {
    throw new AppError(
      'Owner deposits must be cash, MoMo, or bank, not credit',
      400,
    );
  }
  if (input.amount <= 0) {
    throw new AppError('Deposit amount must be greater than zero', 400);
  }

  return prisma.$transaction(async (tx) => {
    const moneyAccount = await findPaymentAccount(
      tx,
      businessId,
      input.paymentMethod,
    );
    const capitalAccount = await findAccountBySubtype(
      tx,
      businessId,
      'owner_capital',
    );

    const reference = await generateReferenceNumber(
      tx,
      businessId,
      'owner_deposit',
    );
    const entry = await tx.journalEntry.create({
      data: {
        businessId,
        entryDate: new Date(),
        description: 'Owner deposit',
        entryType: 'owner_deposit',
        referenceNumber: reference,
        source: 'manual',
        paymentMethod: input.paymentMethod as never,
        createdById: userId,
      },
    });

    // DEBIT money (in), CREDIT owner capital (stake up)
    await tx.journalLine.createMany({
      data: [
        {
          businessId,
          entryId: entry.id,
          accountId: moneyAccount.id,
          debit: input.amount,
          credit: 0,
          memo: 'Owner deposit received',
        },
        {
          businessId,
          entryId: entry.id,
          accountId: capitalAccount.id,
          debit: 0,
          credit: input.amount,
          memo: input.notes ?? 'Owner capital contribution',
        },
      ],
    });

    await createAuditLog(tx, {
      businessId,
      actorId: userId,
      entity: 'owner_deposit',
      entityId: entry.id,
      action: 'created',
      referenceNumber: entry.referenceNumber,
      summary: `Owner deposited ${input.amount} into the business via ${input.paymentMethod}`,
      details: {
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        notes: input.notes ?? null,
      },
    });

    return {
      referenceNumber: entry.referenceNumber,
      type: 'deposit',
      amount: input.amount,
      paymentMethod: input.paymentMethod,
    };
  });
};

export const postOwnerWithdrawal = async (
  businessId: string,
  userId: string,
  input: OwnerEquityInput,
) => {
  if (input.paymentMethod === 'credit') {
    throw new AppError(
      'Owner withdrawals must be cash, MoMo, or bank, not credit',
      400,
    );
  }
  if (input.amount <= 0) {
    throw new AppError('Withdrawal amount must be greater than zero', 400);
  }

  return prisma.$transaction(async (tx) => {
    const moneyAccount = await findPaymentAccount(
      tx,
      businessId,
      input.paymentMethod,
    );
    const drawingsAccount = await findAccountBySubtype(
      tx,
      businessId,
      'owner_drawings',
    );

    const reference = await generateReferenceNumber(
      tx,
      businessId,
      'owner_withdrawal',
    );
    const entry = await tx.journalEntry.create({
      data: {
        businessId,
        entryDate: new Date(),
        description: 'Owner withdrawal',
        entryType: 'owner_withdrawal',
        referenceNumber: reference,
        source: 'manual',
        paymentMethod: input.paymentMethod as never,
        createdById: userId,
      },
    });

    await tx.journalLine.createMany({
      data: [
        {
          businessId,
          entryId: entry.id,
          accountId: drawingsAccount.id,
          debit: input.amount,
          credit: 0,
          memo: input.notes ?? 'Owner drawings',
        },
        {
          businessId,
          entryId: entry.id,
          accountId: moneyAccount.id,
          debit: 0,
          credit: input.amount,
          memo: 'Owner withdrawal paid',
        },
      ],
    });

    await createAuditLog(tx, {
      businessId,
      actorId: userId,
      entity: 'owner_withdrawal',
      entityId: entry.id,
      action: 'created',
      referenceNumber: entry.referenceNumber,
      summary: `Owner withdrew ${input.amount} from the business via ${input.paymentMethod}`,
      details: {
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        notes: input.notes ?? null,
      },
    });

    return {
      referenceNumber: entry.referenceNumber,
      type: 'withdrawal',
      amount: input.amount,
      paymentMethod: input.paymentMethod,
    };
  });
};
