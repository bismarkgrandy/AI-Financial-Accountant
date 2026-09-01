/// <reference types="jest" />

import prisma from '@/config/database';
import { listAuditLogs } from '@/modules/audit/audit.service';

jest.mock('@/config/database', () => ({
  __esModule: true,
  default: {
    auditLog: {
      findMany: jest.fn(),
    },
  },
}));

describe('listAuditLogs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns audit entries ordered newest first', async () => {
    (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'audit-1',
        businessId: 'business-1',
        actorId: 'user-1',
        entity: 'sale',
        entityId: 'sale-1',
        action: 'created',
        referenceNumber: 'SR-0001',
        summary: 'Jane created sale SR-0001',
        details: { totalRevenue: 200 },
        createdAt: new Date('2026-09-01T12:00:00Z'),
      },
    ]);

    const result = await listAuditLogs('business-1', {
      page: 1,
      limit: 10,
    });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ businessId: 'business-1' }),
        orderBy: { createdAt: 'desc' },
      }),
    );

    expect(result.auditLogs).toHaveLength(1);
    expect(result.auditLogs[0]).toMatchObject({
      entity: 'sale',
      action: 'created',
      summary: 'Jane created sale SR-0001',
    });
  });
});
