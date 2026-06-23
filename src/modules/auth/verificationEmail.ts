import { sendEmail } from '@/services/email/email.service';
import { env } from '@/config/env';

export const sendVerificationEmail = (to: string, code: string): Promise<void> =>
  sendEmail({
    to,
    subject: 'Your FinMind verification code',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 16px;">Verify your email</h2>
        <p style="margin: 0 0 8px;">Your verification code is:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 8px 0 16px;">${code}</p>
        <p style="margin: 0 0 8px;">This code expires in ${env.OTP_EXPIRY_MINUTES} minutes.</p>
        <p style="color: #888; font-size: 13px; margin: 16px 0 0;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
    text: `Your FinMind verification code is ${code}. It expires in ${env.OTP_EXPIRY_MINUTES} minutes.`,
  });

  export const sendPasswordResetEmail = (to: string, code: string): Promise<void> =>
  sendEmail({
    to,
    subject: 'Your FinMind password reset code',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 16px;">Reset your password</h2>
        <p style="margin: 0 0 8px;">Your password reset code is:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 8px 0 16px;">${code}</p>
        <p style="margin: 0 0 8px;">This code expires in ${env.OTP_EXPIRY_MINUTES} minutes.</p>
        <p style="color: #888; font-size: 13px; margin: 16px 0 0;">If you didn't request a password reset, you can safely ignore this email — your password won't change.</p>
      </div>
    `,
    text: `Your FinMind password reset code is ${code}. It expires in ${env.OTP_EXPIRY_MINUTES} minutes. If you didn't request this, ignore this email.`,
  });