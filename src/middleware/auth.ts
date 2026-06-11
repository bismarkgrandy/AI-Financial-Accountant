import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/utils/jwt';
import { AppError } from './errorHandler';
import { AuthRequest } from '@/types/request';

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = header.split(' ')[1];
    const payload = verifyAccessToken(token);

    const authReq = req as AuthRequest;
    authReq.userId = payload.userId;
    authReq.businessId = payload.businessId;
    authReq.userRole = payload.role;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Access token expired or invalid', 401));
    }
  }
};