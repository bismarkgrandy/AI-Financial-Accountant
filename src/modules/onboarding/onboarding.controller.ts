import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/request';
import * as onboardingService from './onboarding.service';
import { openingBalanceSchema } from './onboarding.schemas';
import { sendSuccess } from '@/utils/response';

export const completeOnboarding = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { businessId, userId } = req as AuthRequest;
    const input = openingBalanceSchema.parse(req.body);
    const result = await onboardingService.completeOnboarding(
      businessId, userId, input,
    );
    sendSuccess(res, result, 200, 'Onboarding completed');
  } catch (error) {
    next(error);
  }
};