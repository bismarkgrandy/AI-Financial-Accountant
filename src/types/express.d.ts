import { UserRole } from '@/types';

declare global {
  namespace Express {
    interface Request {
      businessId: string;
      userId: string;
      userRole: UserRole;
    }
  }
}

export {};
