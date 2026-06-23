import { EmailProvider, EmailMessage } from './email.types';
import { ResendProvider } from './providers/resend.provider';

const provider: EmailProvider = new ResendProvider();

export const sendEmail = (message: EmailMessage): Promise<void> =>
  provider.sendEmail(message);