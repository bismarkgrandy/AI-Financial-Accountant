import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/request';
import * as reportsService from './reports.service';
import { profitLossQuerySchema } from './reports.schemas';
import { sendSuccess } from '@/utils/response';

export const getProfitLoss = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req as AuthRequest;
    console.log('>>> PL CONTROLLER HIT, query =', req.query);
    const filters = profitLossQuerySchema.parse(req.query);
    const result = await reportsService.getProfitLoss(businessId, filters);
    sendSuccess(res, result, 200, 'Profit & loss report');
  } catch (error) {
    next(error);
  }
};

export const getCashPosition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req as AuthRequest;
    const result = await reportsService.getCashPosition(businessId);
    sendSuccess(res, result, 200, 'Cash position');
  } catch (error) {
    next(error);
  }
};