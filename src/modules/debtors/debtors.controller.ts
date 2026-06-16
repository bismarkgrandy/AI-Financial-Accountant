import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/request';
import * as debtorsService from './debtors.service';
import { postDebtorPayment } from '@/journal/postDebtorPayment';
import {
  listDebtorsSchema,
  updateDebtorSchema,
  recordPaymentSchema,
} from './debtors.schemas';
import { sendSuccess, sendCreated } from '@/utils/response';

export const listDebtors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req as AuthRequest;
    const filters = listDebtorsSchema.parse(req.query);
    const debtors = await debtorsService.listDebtors(businessId, filters);
    sendSuccess(res, debtors, 200);
  } catch (error) {
    next(error);
  }
};

export const getDebtor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req as AuthRequest;
    const debtor = await debtorsService.getDebtor(businessId, req.params.id as string);
    sendSuccess(res, debtor, 200);
  } catch (error) {
    next(error);
  }
};

export const recordPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, userId } = req as AuthRequest;
    const input = recordPaymentSchema.parse(req.body);
    const result = await postDebtorPayment(
      businessId,
      userId,
      req.params.id as string,
      input,
    );
    sendCreated(res, result);
  } catch (error) {
    next(error);
  }
};

export const updateDebtor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req as AuthRequest;
    const input = updateDebtorSchema.parse(req.body);
    const debtor = await debtorsService.updateDebtor(
      businessId,
      req.params.id as string,
      input,
    );
    sendSuccess(res, debtor, 200, 'Debtor updated');
  } catch (error) {
    next(error);
  }
};

export const deactivateDebtor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req as AuthRequest;
    const debtor = await debtorsService.deactivateDebtor(
      businessId,
      req.params.id as string,
    );
    sendSuccess(res, debtor, 200, 'Debtor deactivated');
  } catch (error) {
    next(error);
  }
};