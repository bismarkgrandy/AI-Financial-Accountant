import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import {
  signupSchema, loginSchema, refreshSchema, logoutSchema,
} from './auth.schemas';
import { sendSuccess, sendCreated } from '@/utils/response';
import { AuthRequest } from '@/types/request';

// Capture a simple device label from the request
const getDeviceInfo = (req: Request): string => {
  return (req.headers['user-agent'] as string) ?? 'unknown';
};

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = signupSchema.parse(req.body);
    const result = await authService.signup(input, getDeviceInfo(req));
    sendCreated(res, result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { strategy, ...credentials } = loginSchema.parse(req.body);
    const result = await authService.loginWith(strategy, credentials, getDeviceInfo(req));
    sendSuccess(res, result, 200, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const result = await authService.refresh(refreshToken, getDeviceInfo(req));
    sendSuccess(res, result, 200, 'Token refreshed');
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = logoutSchema.parse(req.body);
    await authService.logout(refreshToken);
    sendSuccess(res, null, 200, 'Logged out');
  } catch (error) {
    next(error);
  }
};

export const logoutAll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as AuthRequest).userId;
    await authService.logoutAll(userId);
    sendSuccess(res, null, 200, 'Logged out of all devices');
  } catch (error) {
    next(error);
  }
};