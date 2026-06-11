import { User } from '@prisma/client';
import { AppError } from '@/middleware/errorHandler';
import { AuthStrategy } from './strategy.interface';

export class GoogleOauthStrategy implements AuthStrategy {
  name = 'google_oauth';

  async authenticate(_credentials: unknown): Promise<User> {
    // TODO (Phase 2): verify Google ID token, find/create user, return it
    throw new AppError('Google sign-in is not available yet', 501);
  }
}