import { User } from '@prisma/client';
import prisma from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { issueEmailVerification, confirmEmailVerification, confirmPasswordResetCode } from './verification.service';
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
export const signup = async (input: SignupInput) => {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    if (existing.emailVerified) {
      throw new AppError('An account with this email already exists', 409);
    }

    // Existing UNVERIFIED account → treat as a fresh attempt: update the
    // info (in case they corrected something), then resend OTP.
    // No accounts to re-seed (seeding happens at verification).
    const passwordHash = await hashPassword(input.password);

    await prisma.$transaction(async (tx) => {
      await tx.business.update({
        where: { id: existing.businessId },
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
      await tx.user.update({
        where: { id: existing.id },
        data: {
          fullName: input.ownerName,
          phoneNumber: input.phoneNumber,
          passwordHash,
        },
      });
    });

    await issueEmailVerification(existing.id, existing.email);
    return {
      message: 'A new verification code has been sent to your email.',
      email: existing.email,
    };
  }

  // New email → create business + user (NO accounts seeded yet)
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

    // NOTE: accounts are NOT seeded here — they're seeded at verification.
    return { business, user };
  });

  await issueEmailVerification(result.user.id, result.user.email);

  return {
    message: 'Account created. Check your email for a verification code.',
    email: result.user.email,
  };
};

// ── VERIFY EMAIL (seed accounts on first verification, then issue session) ──
export const verifyEmail = async (
  email: string,
  code: string,
  deviceInfo?: string,
) => {
  const user = await confirmEmailVerification(email, code);

  // Seed the chart of accounts now that the business is verified.
  // Guard against double-seeding (in case of any retry) by checking first.
  const existingAccounts = await prisma.account.count({
    where: { businessId: user.businessId },
  });
  if (existingAccounts === 0) {
    await prisma.$transaction(async (tx) => {
      await seedAccountsForBusiness(user.businessId, tx);
    });
  }

  return issueSession(user, deviceInfo);
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

  // Block unverified accounts: resend a fresh OTP and tell them to verify
  if (!user.emailVerified) {
    await issueEmailVerification(user.id, user.email);
    throw new AppError('Please verify your email. A new code has been sent.', 403);
  }

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
      emailVerified: user.emailVerified,
    },
  };
};

// ── RESEND VERIFICATION (neutral response) ──
export const resendVerification = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.emailVerified) {
    await issueEmailVerification(user.id, user.email);
  }
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.emailVerified) {
    await issueEmailVerification(user.id, user.email, 'password_reset');
  }
};

export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string,
) => {
  const { user, recordId } = await confirmPasswordResetCode(email, code);

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction(async (tx) => {
    // Update the password
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
    // Consume the reset code
    await tx.emailVerification.update({
      where: { id: recordId },
      data: { consumedAt: new Date() },
    });
    // Revoke ALL refresh tokens (log out every device) — security
    await tx.refreshToken.updateMany({
      where: { userId: user.id, revoked: false },
      data: { revoked: true },
    });
  });
};