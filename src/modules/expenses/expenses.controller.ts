import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/request';
import * as expenseService from './expenses.service';
import { createExpenseSchema } from './expenses.schemas';
import { sendSuccess, sendCreated } from '@/utils/response';

export const createExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, userId } = req as AuthRequest;
    const input = createExpenseSchema.parse(req.body);
    const result = await expenseService.createExpense(businessId, userId, input);
    sendCreated(res, result);
  } catch (error) {
    next(error);
  }
};

export const listExpenses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req as AuthRequest;
    const result = await expenseService.listExpenses(businessId, {
      category: req.query.category as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
    });
    sendSuccess(res, result, 200, 'Expenses retrieved');
  } catch (error) {
    next(error);
  }
};