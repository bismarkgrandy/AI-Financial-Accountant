import { User } from '@prisma/client';
import { z } from 'zod';
import prisma from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { comparePassword } from '@/utils/password';
import { AuthStrategy } from './strategy.interface';

const credentialsSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export class EmailPasswordStrategy implements AuthStrategy {
  name = 'email_password';

  async authenticate(credentials: unknown): Promise<User> {
    const { email, password } = credentialsSchema.parse(credentials);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }
    if (!user.isActive) {
      throw new AppError('This account has been deactivated', 403);
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      throw new AppError('Invalid email or password', 401);
    }

    return user;
  }
}