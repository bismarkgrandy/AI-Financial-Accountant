import { Resend } from 'resend';
import { EmailProvider, EmailMessage } from '../email.types';
import { env } from '@/config/env';
import { AppError } from '@/middleware/errorHandler';
import logger from '@/utils/logger';

export class ResendProvider implements EmailProvider {
  private client = new Resend(env.RESEND_API_KEY);

  async sendEmail(message: EmailMessage): Promise<void> {
    const { error } = await this.client.emails.send({
      from: env.EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    if (error) {
      logger.error('Email send failed', { error, to: message.to });
      throw new AppError('Failed to send email. Please try again.', 502);
    }
  }
}