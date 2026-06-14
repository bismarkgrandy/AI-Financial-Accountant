import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/request';
import * as salesService from './sales.service';
import { createSaleSchema } from './sales.schemas';
import { sendCreated } from '@/utils/response';

export const createSale = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { businessId, userId } = req as AuthRequest;
    const input = createSaleSchema.parse(req.body);
    const result = await salesService.createSale(businessId, userId, input);
    sendCreated(res, result);
  } catch (error) {
    next(error);
  }
};