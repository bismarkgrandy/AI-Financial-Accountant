import prisma from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { hashPassword, comparePassword } from '@/utils/password';
import { generateOtp, hashOtp, verifyOtp, OTP_EXPIRY_MINUTES, MAX_OTP_ATTEMPTS } from '@/modules/auth/otp';
import { sendEmailChangeVerification, sendEmailChangedOwnerAlert } from '@/modules/auth/verificationEmail';
import { UpdateMeInput } from './me.validation';

const ME_SELECT = {
  id: true,
  email: true,
  fullName: true,
  phoneNumber: true,
  role: true,
  emailVerified: true,
  isActive: true,
  businessId: true,
  createdAt: true,
  business: {
    select: { name: true, tier: true },
  },
} as const;

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: ME_SELECT,
  });

  if (!user) throw new AppError('User not found', 404);

  return user;
};

export const updateMe = async (userId: string, input: UpdateMeInput) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: input,
    select: ME_SELECT,
  });

  return user;
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) throw new AppError('User not found', 404);

  const isValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isValid) throw new AppError('Current password is incorrect', 400);

  const newHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  return { message: 'Password changed successfully' };
};

// Step 1: user requests a change to newEmail. Their current `email` is untouched.
export const requestEmailChange = async (userId: string, newEmail: string) => {
  const existing = await prisma.user.findUnique({ where: { email: newEmail } });
  if (existing) throw new AppError('That email is already in use', 409);

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser) throw new AppError('User not found', 404);

  if (currentUser.email === newEmail) {
    throw new AppError('That is already your current email', 400);
  }

  const code = generateOtp();
  const codeHash = await hashOtp(code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { pendingEmail: newEmail } }),
    prisma.emailVerification.deleteMany({ where: { userId, purpose: 'email_change' } }),
    prisma.emailVerification.create({
      data: { userId, purpose: 'email_change', codeHash, expiresAt },
    }),
  ]);

  await sendEmailChangeVerification(newEmail, code);

  return { message: 'Verification code sent to your new email' };
};

// Step 2: user submits the code sent to pendingEmail. On success, email is
// swapped over and the business owner is alerted by email.
export const confirmEmailChange = async (userId: string, code: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  if (!user.pendingEmail) {
    throw new AppError('No pending email change. Please request one first.', 400);
  }

  const record = await prisma.emailVerification.findFirst({
    where: { userId, purpose: 'email_change' },
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

  const oldEmail = user.email;
  const newEmail = user.pendingEmail;

  const updatedUser = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { email: newEmail, pendingEmail: null },
      select: ME_SELECT,
    });
    await tx.emailVerification.deleteMany({ where: { userId, purpose: 'email_change' } });
    return updated;
  });

  // Notify the owner by email — fire-and-forget, must not block or fail
  // the response if Resend has a hiccup; the change itself already succeeded.
  const owner = await prisma.user.findFirst({
    where: { businessId: updatedUser.businessId, role: 'owner' },
  });

  if (owner && owner.id !== userId) {
    sendEmailChangedOwnerAlert(owner.email, user.fullName, oldEmail, newEmail).catch((err) => {
      console.error('Failed to send owner email-change alert:', err);
    });
  }

  return updatedUser;
};