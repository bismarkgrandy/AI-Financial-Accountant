import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/request';
import * as usersService from './users.service';
import { inviteStaffSchema, acceptInviteSchema, updateRoleSchema } from './users.validation';
import { sendSuccess, sendCreated } from '@/utils/response';

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req as AuthRequest;
    const users = await usersService.listUsers(businessId);
    sendSuccess(res, users, 200);
  } catch (error) {
    next(error);
  }
};

export const listPendingInvites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req as AuthRequest;
    const invites = await usersService.listPendingInvites(businessId);
    sendSuccess(res, invites, 200);
  } catch (error) {
    next(error);
  }
};

export const inviteStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, userId } = req as AuthRequest;
    const input = inviteStaffSchema.parse(req.body);
    const result = await usersService.inviteStaff(businessId, userId, input);
    sendCreated(res, result);
  } catch (error) {
    next(error);
  }
};

export const acceptInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = acceptInviteSchema.parse(req.body);
    const deviceInfo = (req.headers['user-agent'] as string) ?? 'unknown';
    const result = await usersService.acceptInvite(input, deviceInfo);
    sendCreated(res, result);
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, userId } = req as AuthRequest;
    const input = updateRoleSchema.parse(req.body);
    const user = await usersService.updateUserRole(businessId, userId, req.params.id as string, input);
    sendSuccess(res, user, 200, 'Role updated');
  } catch (error) {
    next(error);
  }
};

export const deactivateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, userId } = req as AuthRequest;
    const user = await usersService.setUserActive(businessId, userId, req.params.id as string, false);
    sendSuccess(res, user, 200, 'User deactivated');
  } catch (error) {
    next(error);
  }
};

export const activateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, userId } = req as AuthRequest;
    const user = await usersService.setUserActive(businessId, userId, req.params.id as string, true);
    sendSuccess(res, user, 200, 'User activated');
  } catch (error) {
    next(error);
  }
};