import { Router } from 'express';
import * as onboardingController from './onboarding.controller';
import { authenticate } from '@/middleware/auth';
import { requireRole } from '@/middleware/roles';

const router = Router();

// Only the owner completes onboarding, and they must be authenticated
router.post(
  '/complete',
  authenticate,
  requireRole('owner'),
  onboardingController.completeOnboarding,
);

export default router;