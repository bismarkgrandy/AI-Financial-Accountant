import prisma from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { UpdateDebtorInput } from './debtors.schemas';

// Sum a debtor's outstanding debts → their total owed
const sumOutstanding = (debts: { amountOutstanding: unknown }[]): number =>
  debts.reduce((sum, d) => sum + Number(d.amountOutstanding), 0);

export const listDebtors = async (
  businessId: string,
  filters: { search?: string; hasDebt?: string; isActive?: string },
) => {
  const debtors = await prisma.debtor.findMany({
    where: {
      businessId,
      ...(filters.search
        ? { name: { contains: filters.search, mode: 'insensitive' } }
        : {}),
      ...(filters.isActive === 'false' ? { isActive: false } : { isActive: true }),
    },
    include: {
      debts: {
        where: { status: { in: ['outstanding', 'partial'] } },
        select: { amountOutstanding: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Attach computed total owed to each debtor
  let result = debtors.map((d) => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    notes: d.notes,
    isActive: d.isActive,
    totalOwed: sumOutstanding(d.debts),
    openDebtCount: d.debts.length,
  }));

  // Optionally filter to only those who currently owe
  if (filters.hasDebt === 'true') {
  result = result.filter((d) => d.totalOwed > 0);
} else if (filters.hasDebt === 'false') {
  result = result.filter((d) => d.totalOwed === 0);
}

  return result;
};

export const getDebtor = async (businessId: string, debtorId: string) => {
  const debtor = await prisma.debtor.findFirst({
    where: { id: debtorId, businessId },
    include: {
      debts: {
        orderBy: { debtDate: 'asc' },
      },
      payments: {
        orderBy: { paymentDate: 'desc' },
        take: 20,
      },
    },
  });

  if (!debtor) {
    throw new AppError('Debtor not found', 404);
  }

  const totalOwed = sumOutstanding(
    debtor.debts.filter((d) => d.status !== 'paid'),
  );

  return {
    id: debtor.id,
    name: debtor.name,
    phone: debtor.phone,
    notes: debtor.notes,
    isActive: debtor.isActive,
    totalOwed,
    debts: debtor.debts.map((d) => ({
      id: d.id,
      amountOriginal: Number(d.amountOriginal),
      amountOutstanding: Number(d.amountOutstanding),
      debtDate: d.debtDate,
      dueDate: d.dueDate,
      status: d.status,
    })),
    recentPayments: debtor.payments.map((p) => ({
      id: p.id,
      amountPaid: Number(p.amountPaid),
      paymentMethod: p.paymentMethod,
      paymentDate: p.paymentDate,
      notes: p.notes,
    })),
  };
};

export const updateDebtor = async (
  businessId: string,
  debtorId: string,
  input: UpdateDebtorInput,
) => {
  const existing = await prisma.debtor.findFirst({
    where: { id: debtorId, businessId },
  });
  if (!existing) {
    throw new AppError('Debtor not found', 404);
  }

  const debtor = await prisma.debtor.update({
    where: { id: debtorId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });

  return debtor;
};

export const deactivateDebtor = async (
  businessId: string,
  debtorId: string,
) => {
  const existing = await prisma.debtor.findFirst({
    where: { id: debtorId, businessId },
    include: {
      debts: {
        where: { status: { in: ['outstanding', 'partial'] } },
        select: { id: true },
      },
    },
  });
  if (!existing) {
    throw new AppError('Debtor not found', 404);
  }

  // Guard — don't hide a debtor who still owes you money
  if (existing.debts.length > 0) {
    throw new AppError(
      'Cannot deactivate a debtor who still has outstanding debts. ' +
        'Settle their debts first.',
      400,
    );
  }

  const debtor = await prisma.debtor.update({
    where: { id: debtorId },
    data: { isActive: false },
  });

  return debtor;
};