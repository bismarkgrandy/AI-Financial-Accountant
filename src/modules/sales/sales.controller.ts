import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/request';
import * as salesService from './sales.service';
import { createSaleSchema, listSalesSchema } from './sales.schemas';
import { sendCreated, sendSuccess } from '@/utils/response';

export const listSales = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { businessId } = req as AuthRequest;
    const filters = listSalesSchema.parse(req.query);
    const result = await salesService.listSales(businessId, filters);
    sendSuccess(res, result, 200, 'Sales retrieved');
  } catch (error) {
    next(error);
  }
};

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
