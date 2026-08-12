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

export const listConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, businessId } = req as AuthRequest;
    const conversations = await aiService.listConversations(userId, businessId);
    sendSuccess(res, conversations, 200);
  } catch (error) {
    next(error);
  }
};

export const getConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, businessId } = req as AuthRequest;
    const conversation = await aiService.getConversation(userId, businessId, req.params.id as string);
    sendSuccess(res, conversation, 200);
  } catch (error) {
    next(error);
  }
};

export const updateConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, businessId } = req as AuthRequest;
    const { title, status } = req.body;
    const conversation = await aiService.updateConversation(userId, businessId, req.params.id as string, { title, status });
    sendSuccess(res, conversation, 200, 'Conversation updated');
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, businessId } = req as AuthRequest;
    await aiService.deleteConversation(userId, businessId, req.params.id as string);
    sendSuccess(res, null, 200, 'Conversation deleted');
  } catch (error) {
    next(error);
  }
};