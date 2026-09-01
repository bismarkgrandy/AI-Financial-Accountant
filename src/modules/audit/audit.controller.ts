import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/request';
import * as auditService from './audit.service';
import { listAuditLogsSchema } from './audit.schemas';
import { sendSuccess } from '@/utils/response';

export const listAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { businessId } = req as AuthRequest;
    const filters = listAuditLogsSchema.parse(req.query);
    const result = await auditService.listAuditLogs(businessId, filters);
    sendSuccess(res, result, 200, 'Audit logs retrieved');
  } catch (error) {
    next(error);
  }
};
