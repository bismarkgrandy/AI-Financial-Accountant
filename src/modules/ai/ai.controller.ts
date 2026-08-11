import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/request';
import * as aiService from './ai.service';
import { sendSuccess } from '@/utils/response';
import { AppError } from '@/middleware/errorHandler';

export const askAi = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, userId, userRole } = req as AuthRequest;
    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string') {
      throw new AppError('message is required', 400);
    }

    const result = await aiService.askAi(businessId, userId, userRole, message, conversationId);
    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
};