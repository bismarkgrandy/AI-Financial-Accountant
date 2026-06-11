import { Request } from 'express';

export interface AuthRequest extends Request {
  userId: string;
  businessId: string;
  userRole: 'owner' | 'manager' | 'cashier' | 'stock_manager';
}