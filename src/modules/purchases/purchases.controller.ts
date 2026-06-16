import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/request';
import * as purchasesService from './purchases.service';
import { createPurchaseSchema } from './purchases.schemas';
import { sendCreated } from '@/utils/response';

export const createPurchase = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { businessId, userId } = req as AuthRequest;
    const input = createPurchaseSchema.parse(req.body);
    const result = await purchasesService.createPurchase(businessId, userId, input);
    sendCreated(res, result);
  } catch (error) {
    next(error);
  }
};