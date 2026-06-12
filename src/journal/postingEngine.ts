import { Prisma } from '@prisma/client';
import prisma from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { findAccountBySubtype } from '@/utils/accountFinder';
import { generateReferenceNumber } from '@/utils/referenceNumber';

export interface OpeningBalanceInput {
  cashInHand?: number;
  mtnMomo?: number;
  telecel?: number;
  airtel?: number;
  bankBalance?: number;
  stockValue?: number;
  debtorsTotal?: number;
  creditorsTotal?: number;
}

export const postOpeningBalance = async (
  businessId: string,
  userId: string,
  input: OpeningBalanceInput,
) => {
  // Default any missing values to 0
  const cashInHand = input.cashInHand ?? 0;
  const mtnMomo = input.mtnMomo ?? 0;
  const telecel = input.telecel ?? 0;
  const airtel = input.airtel ?? 0;
  const bankBalance = input.bankBalance ?? 0;
  const stockValue = input.stockValue ?? 0;
  const debtorsTotal = input.debtorsTotal ?? 0;
  const creditorsTotal = input.creditorsTotal ?? 0;

  // Total assets and liabilities
  const totalAssets =
    cashInHand + mtnMomo + telecel + airtel +
    bankBalance + stockValue + debtorsTotal;
  const totalLiabilities = creditorsTotal;

  // ── VALIDATION ──
  // A business cannot open with only debts and nothing owned.
  // This rejects the economically incoherent case (e.g. only
  // creditors entered, which would make owner capital negative
  // and meaningless as an opening position).
  if (totalAssets <= 0) {
    throw new AppError(
      'Opening balance must include what your business owns ' +
        '(cash, mobile money, stock, or money owed to you). ' +
        'You cannot open a business with only debts.',
      400,
    );
  }

  // Owner capital is the balancing figure
  // Assets = Liabilities + Equity  →  Equity = Assets − Liabilities
  const ownerCapital = totalAssets - totalLiabilities;

  // Everything in ONE transaction
  return prisma.$transaction(async (tx) => {
    // 1. Create the journal entry (the header)
    const reference = await generateReferenceNumber(
      tx,
      businessId,
      'opening_balance',
    );

    const entry = await tx.journalEntry.create({
      data: {
        businessId,
        entryDate: new Date(),
        description: 'Opening balance',
        entryType: 'opening_balance',
        referenceNumber: reference,
        source: 'system',
        createdById: userId,
      },
    });

    // 2. Build the journal lines (debits and credits)
    const lines: Prisma.JournalLineCreateManyInput[] = [];

    // Helper to add a debit line (for assets)
    const addDebit = async (subtype: string, amount: number) => {
      if (amount <= 0) return; // skip zero amounts
      const account = await findAccountBySubtype(tx, businessId, subtype);
      lines.push({
        businessId,
        entryId: entry.id,
        accountId: account.id,
        debit: amount,
        credit: 0,
      });
    };

    // Helper to add a credit line (for liabilities/equity)
    const addCredit = async (subtype: string, amount: number) => {
      if (amount <= 0) return;
      const account = await findAccountBySubtype(tx, businessId, subtype);
      lines.push({
        businessId,
        entryId: entry.id,
        accountId: account.id,
        debit: 0,
        credit: amount,
      });
    };

    // ASSETS — debited (assets increase with debits)
    await addDebit('cash_hand', cashInHand);
    await addDebit('cash_momo_mtn', mtnMomo);
    await addDebit('cash_momo_telecel', telecel);
    await addDebit('cash_momo_airtel', airtel);
    await addDebit('cash_bank', bankBalance);
    await addDebit('stock', stockValue);
    await addDebit('debtors', debtorsTotal);

    // LIABILITIES — credited (liabilities increase with credits)
    await addCredit('creditors', creditorsTotal);

    // EQUITY — owner capital, the balancing figure
    // (totalAssets > 0 is guaranteed above, but capital can still
    // be lower than liabilities if creditors are high; if so it
    // would be a debit. We keep the sign-safe handling.)
    if (ownerCapital >= 0) {
      await addCredit('owner_capital', ownerCapital);
    } else {
      await addDebit('owner_capital', Math.abs(ownerCapital));
    }

    // Safety check — we must have at least 2 lines to balance
    if (lines.length < 2) {
      throw new AppError(
        'Opening balance must include at least one value',
        400,
      );
    }

    // 3. Write all the lines at once
    await tx.journalLine.createMany({ data: lines });

    // The balance trigger fires here at commit.
    // If debits ≠ credits, the whole transaction rolls back.

    return {
      entry,
      lineCount: lines.length,
      ownerCapital,
      totalAssets,
      totalLiabilities,
    };
  });
};