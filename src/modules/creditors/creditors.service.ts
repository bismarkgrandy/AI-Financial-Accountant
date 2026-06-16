import prisma from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { UpdateCreditorInput } from './creditors.schemas';

// Sum a creditor's outstanding payables → total you owe them
const sumOutstanding = (payables: { amountOutstanding: unknown }[]): number =>
  payables.reduce((sum, p) => sum + Number(p.amountOutstanding), 0);

export const listCreditors = async (
  businessId: string,
  filters: { search?: string; hasDebt?: string; isActive?: string },
) => {
  const creditors = await prisma.creditor.findMany({
    where: {
      businessId,
      ...(filters.search
        ? { name: { contains: filters.search, mode: 'insensitive' } }
        : {}),
      ...(filters.isActive === 'false' ? { isActive: false } : { isActive: true }),
    },
    include: {
      payables: {
        where: { status: { in: ['outstanding', 'partial'] } },
        select: { amountOutstanding: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  let result = creditors.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    notes: c.notes,
    isActive: c.isActive,
    totalOwed: sumOutstanding(c.payables),
    openPayableCount: c.payables.length,
  }));

  if (filters.hasDebt === 'true') {
    result = result.filter((c) => c.totalOwed > 0);
  } else if (filters.hasDebt === 'false') {
    result = result.filter((c) => c.totalOwed === 0);
  }

  return result;
};

export const getCreditor = async (businessId: string, creditorId: string) => {
  const creditor = await prisma.creditor.findFirst({
    where: { id: creditorId, businessId },
    include: {
      payables: { orderBy: { debtDate: 'asc' } },
      payments: { orderBy: { paymentDate: 'desc' }, take: 20 },
    },
  });

  if (!creditor) {
    throw new AppError('Creditor not found', 404);
  }

  const totalOwed = sumOutstanding(
    creditor.payables.filter((p) => p.status !== 'paid'),
  );

  return {
    id: creditor.id,
    name: creditor.name,
    phone: creditor.phone,
    notes: creditor.notes,
    isActive: creditor.isActive,
    totalOwed,
    payables: creditor.payables.map((p) => ({
      id: p.id,
      amountOriginal: Number(p.amountOriginal),
      amountOutstanding: Number(p.amountOutstanding),
      debtDate: p.debtDate,
      dueDate: p.dueDate,
      status: p.status,
    })),
    recentPayments: creditor.payments.map((p) => ({
      id: p.id,
      amountPaid: Number(p.amountPaid),
      paymentMethod: p.paymentMethod,
      paymentDate: p.paymentDate,
      notes: p.notes,
    })),
  };
};

export const updateCreditor = async (
  businessId: string,
  creditorId: string,
  input: UpdateCreditorInput,
) => {
  const existing = await prisma.creditor.findFirst({
    where: { id: creditorId, businessId },
  });
  if (!existing) {
    throw new AppError('Creditor not found', 404);
  }

  const creditor = await prisma.creditor.update({
    where: { id: creditorId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });

  return creditor;
};

export const deactivateCreditor = async (
  businessId: string,
  creditorId: string,
) => {
  const existing = await prisma.creditor.findFirst({
    where: { id: creditorId, businessId },
    include: {
      payables: {
        where: { status: { in: ['outstanding', 'partial'] } },
        select: { id: true },
      },
    },
  });
  if (!existing) {
    throw new AppError('Creditor not found', 404);
  }

  // Guard — don't hide a supplier you still owe money to
  if (existing.payables.length > 0) {
    throw new AppError(
      'Cannot deactivate a supplier you still owe money to. ' +
        'Settle what you owe them first.',
      400,
    );
  }

  const creditor = await prisma.creditor.update({
    where: { id: creditorId },
    data: { isActive: false },
  });

  return creditor;
};