import { Request, Response, NextFunction } from 'express';
import prisma from '@/config/database';
import { AppError } from './errorHandler';
import { AuthRequest } from '@/types/request';

export const requireOnboarding = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const { businessId } = req as AuthRequest;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { onboardingComplete: true },
    });

    if (!business?.onboardingComplete) {
      throw new AppError(
        'Please complete onboarding before recording transactions',
        403,
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};