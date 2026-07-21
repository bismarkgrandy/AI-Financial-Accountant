import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/request';
import * as businessService from './business.service';
import { updateBusinessSchema } from './business.validation';
import { sendSuccess } from '@/utils/response';

export const getBusinessProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req as AuthRequest;
    const business = await businessService.getBusinessProfile(businessId);
    sendSuccess(res, business, 200);
  } catch (error) {
    next(error);
  }
};

export const updateBusinessProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req as AuthRequest;
    const input = updateBusinessSchema.parse(req.body);
    const business = await businessService.updateBusinessProfile(businessId, input);
    sendSuccess(res, business, 200, 'Business profile updated');
  } catch (error) {
    next(error);
  }
};