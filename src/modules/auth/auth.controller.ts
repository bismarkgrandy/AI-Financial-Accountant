import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import {
  signupSchema, loginSchema, refreshSchema, logoutSchema,
  verifyEmailSchema, resendVerificationSchema, forgotPasswordSchema, resetPasswordSchema,
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
    const result = await authService.signup(input);
    sendCreated(res, result);
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code } = verifyEmailSchema.parse(req.body);
    const result = await authService.verifyEmail(email, code, getDeviceInfo(req));
    sendSuccess(res, result, 200, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
};

export const resendVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = resendVerificationSchema.parse(req.body);
    await authService.resendVerification(email);
    sendSuccess(res, null, 200, 'If the account exists, a new code has been sent.');
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

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(email);
    sendSuccess(res, null, 200, 'If the account exists, a reset code has been sent.');
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code, newPassword } = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(email, code, newPassword);
    sendSuccess(res, null, 200, 'Password reset successfully. Please log in with your new password.');
  } catch (error) {
    next(error);
  }
};