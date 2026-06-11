import { v4 as uuidv4 } from 'uuid';
import prisma from '@/config/database';
import { env } from '@/config/env';
import { signRefreshToken } from '@/utils/jwt';
import { hashToken } from '@/utils/tokenHash';

const parseExpiryToDate = (expiresIn: string): Date => {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const ms =
    unit === 's' ? value * 1000 :
    unit === 'm' ? value * 60 * 1000 :
    unit === 'h' ? value * 60 * 60 * 1000 :
    value * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms);
};

export const issueRefreshToken = async (
  userId: string,
  deviceInfo?: string,
): Promise<string> => {
  const tokenId = uuidv4();
  const rawToken = signRefreshToken({ userId, tokenId });

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      deviceInfo: deviceInfo ?? null,
      expiresAt: parseExpiryToDate(env.JWT_REFRESH_EXPIRES_IN),
    },
  });

  return rawToken;
};

export const findStoredToken = async (rawToken: string) => {
  return prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });
};

export const revokeToken = async (rawToken: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(rawToken) },
    data: { revoked: true },
  });
};

export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
};