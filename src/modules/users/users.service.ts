import prisma from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { hashPassword } from '@/utils/password';
import { signAccessToken } from '@/utils/jwt';
import { issueRefreshToken } from '@/modules/auth/refreshToken.service';
import { generateInviteCode, hashInviteCode } from './invite-code';
import { sendStaffInviteEmail } from '@/modules/auth/verificationEmail';
import { env } from '@/config/env';
import { InviteStaffInput, AcceptInviteInput, UpdateRoleInput } from './users.validation';
import { revokeAllUserTokens } from '@/modules/auth/refreshToken.service';

const USER_LIST_SELECT = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  roleTitle: true,
  isActive: true,
  createdAt: true,
} as const;

export const listUsers = async (businessId: string) => {
  return prisma.user.findMany({
    where: { businessId },
    select: USER_LIST_SELECT,
    orderBy: { createdAt: 'asc' },
  });
};

export const listPendingInvites = async (businessId: string) => {
  return prisma.staffInvite.findMany({
    where: { businessId, acceptedAt: null, expiresAt: { gt: new Date() } },
    select: {
      id: true,
      email: true,
      role: true,
      roleTitle: true,
      expiresAt: true,
      createdAt: true,
      invitedBy: { select: { fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const inviteStaff = async (
  businessId: string,
  invitedById: string,
  input: InviteStaffInput,
) => {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) {
    throw new AppError(
      existingUser.businessId === businessId
        ? 'This person is already on your team'
        : 'This email is already registered with another business',
      409,
    );
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { name: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const code = generateInviteCode();
  const codeHash = hashInviteCode(code);
  const expiresAt = new Date(Date.now() + env.INVITE_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.staffInvite.deleteMany({
    where: { businessId, email: input.email, acceptedAt: null },
  });

  await prisma.staffInvite.create({
    data: {
      businessId,
      email: input.email,
      role: input.role,
      roleTitle: input.roleTitle,
      codeHash,
      invitedById,
      expiresAt,
    },
  });

  const roleLabel = input.roleTitle || input.role.replace('_', ' ');
  await sendStaffInviteEmail(input.email, code, business.name, roleLabel);

  return { message: 'Invite sent' };
};

export const acceptInvite = async (input: AcceptInviteInput, deviceInfo?: string) => {
  const codeHash = hashInviteCode(input.code);

  const invite = await prisma.staffInvite.findFirst({
    where: { codeHash, acceptedAt: null },
  });

  if (!invite) throw new AppError('Invalid or already-used invite code', 400);
  if (invite.expiresAt < new Date()) {
    throw new AppError('This invite has expired. Ask the owner to resend it.', 400);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        businessId: invite.businessId,
        email: invite.email,
        fullName: input.fullName,
        passwordHash,
        role: invite.role,
        roleTitle: invite.roleTitle,
        emailVerified: true,
        isActive: true,
      },
    });

    await tx.staffInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    return createdUser;
  });

  const accessToken = signAccessToken({
    userId: user.id,
    businessId: user.businessId,
    role: user.role,
  });
  const refreshToken = await issueRefreshToken(user.id, deviceInfo);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      roleTitle: user.roleTitle,
      businessId: user.businessId,
    },
  };
};

export const updateUserRole = async (
  businessId: string,
  actingUserId: string,
  targetUserId: string,
  input: UpdateRoleInput,
) => {
  if (targetUserId === actingUserId) {
    throw new AppError('You cannot change your own role', 400);
  }

  const target = await prisma.user.findFirst({ where: { id: targetUserId, businessId } });
  if (!target) throw new AppError('User not found', 404);
  if (target.role === 'owner') {
    throw new AppError('The owner role cannot be reassigned', 400);
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: {
      role: input.role,
      ...(input.roleTitle !== undefined && { roleTitle: input.roleTitle }),
    },
    select: USER_LIST_SELECT,
  });
};

export const setUserActive = async (
  businessId: string,
  actingUserId: string,
  targetUserId: string,
  isActive: boolean,
) => {
  if (targetUserId === actingUserId) {
    throw new AppError('You cannot change your own active status', 400);
  }

  const target = await prisma.user.findFirst({ where: { id: targetUserId, businessId } });
  if (!target) throw new AppError('User not found', 404);
  if (target.role === 'owner') {
    throw new AppError('The owner cannot be deactivated', 400);
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { isActive },
    select: USER_LIST_SELECT,
  });

  if (!isActive) {
    await revokeAllUserTokens(targetUserId);
  }

  return updated;
};