import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/request';
import prisma from '@/config/database';
import { AppError } from '@/middleware/errorHandler';

export const requireVerified = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthRequest;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });
    if (!user?.emailVerified) {
      throw new AppError('Please verify your email before continuing', 403);
    }
    next();
  } catch (error) {
    next(error);
  }
};