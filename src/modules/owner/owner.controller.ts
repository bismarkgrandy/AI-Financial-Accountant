import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/request';
import * as ownerService from './owner.service';
import { ownerEquitySchema, ownerListQuerySchema } from './owner.schemas';
import { sendCreated, sendSuccess } from '@/utils/response';

export const recordDeposit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, userId } = req as AuthRequest;
    const input = ownerEquitySchema.parse(req.body);
    const result = await ownerService.recordDeposit(businessId, userId, input);
    sendCreated(res, result);
  } catch (error) {
    next(error);
  }
};

export const recordWithdrawal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, userId } = req as AuthRequest;
    const input = ownerEquitySchema.parse(req.body);
    const result = await ownerService.recordWithdrawal(businessId, userId, input);
    sendCreated(res, result);
  } catch (error) {
    next(error);
  }
};

export const listDeposits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req as AuthRequest;
    const filters = ownerListQuerySchema.parse(req.query);   // ← validate
    const result = await ownerService.listDeposits(businessId, filters);
    sendSuccess(res, result, 200, 'Owner deposits');
  } catch (error) {
    next(error);
  }
};

export const listWithdrawals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req as AuthRequest;
    const filters = ownerListQuerySchema.parse(req.query);   // ← validate
    const result = await ownerService.listWithdrawals(businessId, filters);
    sendSuccess(res, result, 200, 'Owner withdrawals');
  } catch (error) {
    next(error);
  }
};