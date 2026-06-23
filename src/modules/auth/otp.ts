import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { env } from '@/config/env';

export const generateOtp = (): string =>
  crypto.randomInt(100000, 1000000).toString();

export const hashOtp = (code: string): Promise<string> => bcrypt.hash(code, 10);

export const verifyOtp = (code: string, hash: string): Promise<boolean> =>
  bcrypt.compare(code, hash);

export const OTP_EXPIRY_MINUTES = env.OTP_EXPIRY_MINUTES;
export const MAX_OTP_ATTEMPTS = env.MAX_OTP_ATTEMPTS;