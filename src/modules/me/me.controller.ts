import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/request';
import * as meService from './me.service';
import {
  updateMeSchema,
  changePasswordSchema,
  requestEmailChangeSchema,
  confirmEmailChangeSchema,
} from './me.validation';
import { sendSuccess } from '@/utils/response';

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthRequest;
    const user = await meService.getMe(userId);
    sendSuccess(res, user, 200);
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthRequest;
    const input = updateMeSchema.parse(req.body);
    const user = await meService.updateMe(userId, input);
    sendSuccess(res, user, 200, 'Profile updated');
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthRequest;
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const result = await meService.changePassword(userId, currentPassword, newPassword);
    sendSuccess(res, result, 200, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

export const requestEmailChange = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthRequest;
    const { newEmail } = requestEmailChangeSchema.parse(req.body);
    const result = await meService.requestEmailChange(userId, newEmail);
    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
};

export const confirmEmailChange = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req as AuthRequest;
    const { code } = confirmEmailChangeSchema.parse(req.body);
    const user = await meService.confirmEmailChange(userId, code);
    sendSuccess(res, user, 200, 'Email updated successfully');
  } catch (error) {
    next(error);
  }
};