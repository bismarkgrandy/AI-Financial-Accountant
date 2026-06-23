import prisma from '@/config/database';
import { VerificationPurpose } from '@prisma/client';

import { AppError } from '@/middleware/errorHandler';
import {
  generateOtp,
  hashOtp,
  verifyOtp,
  OTP_EXPIRY_MINUTES,
  MAX_OTP_ATTEMPTS,
} from './otp';
import { sendVerificationEmail, sendPasswordResetEmail } from './verificationEmail';


export const issueEmailVerification = async (
  userId: string,
  email: string,
  purpose: VerificationPurpose = 'email_verification',
) => {
  const code = generateOtp();
  const codeHash = await hashOtp(code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Delete any prior codes of the SAME purpose for this user
  await prisma.$transaction([
    prisma.emailVerification.deleteMany({ where: { userId, purpose } }),
    prisma.emailVerification.create({
      data: { userId, purpose, codeHash, expiresAt },
    }),
  ]);

  // Send the right email for the purpose
  if (purpose === 'password_reset') {
    await sendPasswordResetEmail(email, code);
  } else {
    await sendVerificationEmail(email, code);
  }
};

// Verify a submitted code; returns the now-verified user on success
export const confirmEmailVerification = async (email: string, code: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('Invalid verification request', 400);
  if (user.emailVerified) throw new AppError('Email is already verified', 409);

  const record = await prisma.emailVerification.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) {
    throw new AppError('No active verification code. Please request a new one.', 400);
  }

  if (record.expiresAt < new Date()) {
    throw new AppError('Verification code has expired. Please request a new one.', 400);
  }
  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    throw new AppError('Too many attempts. Please request a new code.', 429);
  }

  const valid = await verifyOtp(code, record.codeHash);
  if (!valid) {
    await prisma.emailVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw new AppError('Incorrect verification code', 400);
  }

  // Success — mark verified + delete the OTP (one-time use)
  const verifiedUser = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });
    await tx.emailVerification.deleteMany({ where: { userId: user.id } });
    return updated;
  });

  return verifiedUser;
};

export const confirmPasswordResetCode = async (email: string, code: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('Invalid or expired reset code', 400);

  const record = await prisma.emailVerification.findFirst({
    where: { userId: user.id, purpose: 'password_reset', consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw new AppError('Invalid or expired reset code', 400);

  if (record.expiresAt < new Date()) {
    throw new AppError('Reset code has expired. Please request a new one.', 400);
  }
  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    throw new AppError('Too many attempts. Please request a new code.', 429);
  }

  const valid = await verifyOtp(code, record.codeHash);
  if (!valid) {
    await prisma.emailVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw new AppError('Incorrect reset code', 400);
  }

  return { user, recordId: record.id };
};