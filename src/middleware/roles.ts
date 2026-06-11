import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { UserRole } from '@/types';
import { AuthRequest } from '@/types/request';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { userRole } = req as AuthRequest;
    if (!allowedRoles.includes(userRole)) {
      throw new AppError(
        'You do not have permission to perform this action',
        403,
      );
    }
    next();
  };
};