import { User } from '@prisma/client';

export interface AuthStrategy {
  name: string;
  authenticate(credentials: unknown): Promise<User>;
}