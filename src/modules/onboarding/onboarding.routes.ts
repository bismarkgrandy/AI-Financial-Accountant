import { Router } from 'express';
import * as onboardingController from './onboarding.controller';
import { authenticate } from '@/middleware/auth';
import { requireRole } from '@/middleware/roles';
import { requireVerified } from '@/middleware/requireVerified';

const router = Router();

// Only the owner completes onboarding, and they must be authenticated
router.post(
  '/complete',
  authenticate,        // sets userId on the request
  requireVerified,     // now userId exists, so the findUnique works
  requireRole('owner'),
  onboardingController.completeOnboarding,
);

export default router;