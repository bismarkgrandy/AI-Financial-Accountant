import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']),

  DB_USER: z.string().min(1, 'DB_USER is required'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),
  DB_NAME: z.string().min(1, 'DB_NAME is required'),
  DB_PORT: z.string().default('5432'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  PGADMIN_PORT: z.string().default('5050'),
  PGADMIN_EMAIL: z.string().min(1, 'PGADMIN_EMAIL is required'),
  PGADMIN_PASSWORD: z.string().min(1, 'PGADMIN_PASSWORD is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be 32+ chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be 32+ chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  EMAIL_FROM: z.string().min(1, 'EMAIL_FROM is required'),

  OTP_EXPIRY_MINUTES: z.coerce.number().int().positive().default(10),
  MAX_OTP_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_RESEND_MAX: z.coerce.number().int().positive().default(3),
  OTP_RESEND_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),

  INVITE_EXPIRY_HOURS: z.coerce.number().default(48),

  INTERNAL_AI_SERVICE_KEY: z.string().min(32),
  AI_SERVICE_URL: z.string().url(),
  AI_SERVICE_TIMEOUT_MS: z.coerce.number().default(15000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;