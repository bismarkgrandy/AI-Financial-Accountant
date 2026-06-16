import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/request';
import * as creditorsService from './creditors.service';
import { postCreditorPayment } from '@/journal/postCreditorPayment';
import {
  listCreditorsSchema,
  updateCreditorSchema,
  recordCreditorPaymentSchema,
} from './creditors.schemas';
import { sendSuccess, sendCreated } from '@/utils/response';

export const listCreditors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req as AuthRequest;
    const filters = listCreditorsSchema.parse(req.query);
    const creditors = await creditorsService.listCreditors(businessId, filters);
    sendSuccess(res, creditors, 200);
  } catch (error) {
    next(error);
  }
};

export const getCreditor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req as AuthRequest;
    const creditor = await creditorsService.getCreditor(businessId, req.params.id as string);
    sendSuccess(res, creditor, 200);
  } catch (error) {
    next(error);
  }
};

export const recordPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, userId } = req as AuthRequest;
    const input = recordCreditorPaymentSchema.parse(req.body);
    const result = await postCreditorPayment(
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

export const updateCreditor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req as AuthRequest;
    const input = updateCreditorSchema.parse(req.body);
    const creditor = await creditorsService.updateCreditor(
      businessId,
      req.params.id as string,
      input,
    );
    sendSuccess(res, creditor, 200, 'Creditor updated');
  } catch (error) {
    next(error);
  }
};

export const deactivateCreditor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req as AuthRequest;
    const creditor = await creditorsService.deactivateCreditor(
      businessId,
      req.params.id as string,
    );
    sendSuccess(res, creditor, 200, 'Creditor deactivated');
  } catch (error) {
    next(error);
  }
};