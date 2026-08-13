import { Request, Response, NextFunction } from 'express';
import { env } from '@/config/env';

// src/middleware/internalAuth.ts — corrected
export const verifyInternalService = (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers['x-internal-service-key'];

  if (key !== env.INTERNAL_AI_SERVICE_KEY) {
    return res.status(401).json({ success: false, message: 'Unauthorized', data: null });
  }

  const businessId = req.headers['x-on-behalf-of-business'] as string | undefined;
  const userId = req.headers['x-on-behalf-of-user'] as string | undefined;
  const userRole = req.headers['x-on-behalf-of-role'] as string | undefined;

  if (!businessId || !userId || !userRole) {
    return res.status(400).json({ success: false, message: 'Missing on-behalf-of headers', data: null });
  }

  (req as any).businessId = businessId;
  (req as any).userId = userId;
  (req as any).userRole = userRole; // ← must match AuthRequest's field name, same as `authenticate` sets

  next();
};