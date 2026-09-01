import { z } from 'zod';

export const listAuditLogsSchema = z.object({
  entity: z.string().optional(),
  action: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsSchema>;
