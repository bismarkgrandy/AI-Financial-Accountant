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

  export const sendEmailChangeVerification = (to: string, code: string): Promise<void> =>
  sendEmail({
    to,
    subject: 'Confirm your new FinMind email',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 16px;">Confirm your new email</h2>
        <p style="margin: 0 0 8px;">Enter this code in the app to confirm this is your new email address:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 8px 0 16px;">${code}</p>
        <p style="margin: 0 0 8px;">This code expires in ${env.OTP_EXPIRY_MINUTES} minutes.</p>
        <p style="color: #888; font-size: 13px; margin: 16px 0 0;">If you didn't request this, you can safely ignore this email — your login email won't change.</p>
      </div>
    `,
    text: `Your FinMind email-change code is ${code}. It expires in ${env.OTP_EXPIRY_MINUTES} minutes. If you didn't request this, ignore this email.`,
  });

export const sendEmailChangedOwnerAlert = (
  to: string,
  staffName: string,
  oldEmail: string,
  newEmail: string,
): Promise<void> =>
  sendEmail({
    to,
    subject: `${staffName} changed their email`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 16px;">Staff email changed</h2>
        <p style="margin: 0 0 8px;">
          <strong>${staffName}</strong> changed their account email from:
        </p>
        <p style="margin: 4px 0;">${oldEmail}</p>
        <p style="margin: 4px 0 16px;">to:</p>
        <p style="margin: 4px 0 16px;">${newEmail}</p>
        <p style="color: #888; font-size: 13px; margin: 16px 0 0;">
          This is an automatic notice from FinMind. No action is needed unless this is unexpected.
        </p>
      </div>
    `,
    text: `${staffName} changed their account email from ${oldEmail} to ${newEmail}.`,
  });

  export const sendStaffInviteEmail = (
  to: string,
  code: string,
  businessName: string,
  roleLabel: string,
): Promise<void> =>
  sendEmail({
    to,
    subject: `You've been invited to join ${businessName} on FinMind`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 16px;">You're invited</h2>
        <p style="margin: 0 0 8px;">
          You've been invited to join <strong>${businessName}</strong> on FinMind as a <strong>${roleLabel}</strong>.
        </p>
        <p style="margin: 0 0 8px;">Open the FinMind app, tap "I have an invite code," and enter:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 8px 0 16px;">${code}</p>
        <p style="margin: 0 0 8px;">This code expires in 48 hours.</p>
        <p style="color: #888; font-size: 13px; margin: 16px 0 0;">If you weren't expecting this, you can safely ignore this email.</p>
      </div>
    `,
    text: `You've been invited to join ${businessName} on FinMind as a ${roleLabel}. Open the app, tap "I have an invite code," and enter: ${code} (expires in 48 hours).`,
  });