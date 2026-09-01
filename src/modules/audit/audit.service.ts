import { Prisma } from '@prisma/client';
import prisma from '@/config/database';
import { ListAuditLogsQuery } from './audit.schemas';

export const createAuditLog = async (
  tx: Prisma.TransactionClient | typeof prisma,
  data: {
    businessId: string;
    actorId: string;
    entity: string;
    entityId: string;
    action: string;
    referenceNumber?: string;
    summary: string;
    details?: Prisma.InputJsonValue;
  },
) => {
  return tx.auditLog.create({
    data: {
      businessId: data.businessId,
      actorId: data.actorId,
      entity: data.entity,
      entityId: data.entityId,
      action: data.action,
      referenceNumber: data.referenceNumber ?? null,
      summary: data.summary,
      details: data.details ?? undefined,
    },
  });
};

export const listAuditLogs = async (
  businessId: string,
  filters: ListAuditLogsQuery,
) => {
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      businessId,
      ...(filters.entity ? { entity: filters.entity } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {}),
    },
    include: {
      actor: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: (filters.page - 1) * filters.limit,
    take: filters.limit,
  });

  return {
    auditLogs: auditLogs.map((entry) => ({
      id: entry.id,
      actorId: entry.actorId,
      actorName: entry.actor?.fullName ?? 'Unknown',
      entity: entry.entity,
      entityId: entry.entityId,
      action: entry.action,
      referenceNumber: entry.referenceNumber,
      summary: entry.summary,
      details: entry.details,
      createdAt: entry.createdAt,
    })),
    count: auditLogs.length,
  };
};
