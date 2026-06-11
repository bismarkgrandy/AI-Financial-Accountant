import { User } from '@prisma/client';
import prisma from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { signAccessToken, verifyRefreshToken } from '@/utils/jwt';
import { hashPassword } from '@/utils/password';
import { seedAccountsForBusiness } from './seedAccounts';
import { SignupInput } from './auth.schemas';

import {
  issueRefreshToken,
  findStoredToken,
  revokeToken,
  revokeAllUserTokens,
} from './refreshToken.service';

import { AuthStrategy } from './strategies/strategy.interface';
import { EmailPasswordStrategy } from './strategies/emailPassword.strategy';
import { GoogleOauthStrategy } from './strategies/googleOauth.strategy';

// ── Strategy registry ──
const strategies: Record<string, AuthStrategy> = {
  email_password: new EmailPasswordStrategy(),
  google_oauth: new GoogleOauthStrategy(),
};

// ── SIGNUP ──
export const signup = async (input: SignupInput, deviceInfo?: string) => {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const passwordHash = await hashPassword(input.password);

  const result = await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        name: input.businessName,
        type: input.businessType,
        ownerName: input.ownerName,
        phoneNumber: input.phoneNumber,
        locationRegion: input.locationRegion,
        locationDistrict: input.locationDistrict,
        tier: input.tier,
        recordingMode: input.recordingMode,
      },
    });

    const user = await tx.user.create({
      data: {
        businessId: business.id,
        fullName: input.ownerName,
        email: input.email,
        phoneNumber: input.phoneNumber,
        passwordHash,
        role: 'owner',
      },
    });

    await seedAccountsForBusiness(business.id, tx);

    return { business, user };
  });

  return issueSession(result.user, deviceInfo, result.business);
};

// ── LOGIN ──
export const loginWith = async (
  strategyName: string,
  credentials: unknown,
  deviceInfo?: string,
) => {
  const strategy = strategies[strategyName];
  if (!strategy) {
    throw new AppError(`Unsupported login method: ${strategyName}`, 400);
  }

  const user = await strategy.authenticate(credentials);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return issueSession(user, deviceInfo);
};

// ── REFRESH (with rotation + reuse detection) ──
export const refresh = async (rawRefreshToken: string, deviceInfo?: string) => {
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const stored = await findStoredToken(rawRefreshToken);

  if (!stored) {
    await revokeAllUserTokens(payload.userId);
    throw new AppError('Refresh token reuse detected. Please log in again.', 401);
  }

  if (stored.revoked) {
    await revokeAllUserTokens(stored.userId);
    throw new AppError('Refresh token reuse detected. Please log in again.', 401);
  }

  if (stored.expiresAt < new Date()) {
    throw new AppError('Refresh token has expired. Please log in again.', 401);
  }

  await revokeToken(rawRefreshToken);

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user || !user.isActive) {
    throw new AppError('Account not found or deactivated', 401);
  }

  return issueSession(user, deviceInfo);
};

export const logout = async (rawRefreshToken: string) => {
  await revokeToken(rawRefreshToken);
};

export const logoutAll = async (userId: string) => {
  await revokeAllUserTokens(userId);
};

const issueSession = async (
  user: User,
  deviceInfo?: string,
  loadedBusiness?: { id: string; name: string; tier: string; onboardingComplete: boolean },
) => {
  const accessToken = signAccessToken({
    userId: user.id,
    businessId: user.businessId,
    role: user.role,
  });

  const refreshToken = await issueRefreshToken(user.id, deviceInfo);

  const business =
    loadedBusiness ??
    (await prisma.business.findUnique({ where: { id: user.businessId } }))!;

  return {
    accessToken,
    refreshToken,
    business: {
      id: business.id,
      name: business.name,
      tier: business.tier,
      onboardingComplete: business.onboardingComplete,
    },
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  };
};