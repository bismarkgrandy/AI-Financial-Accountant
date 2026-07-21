import { Router } from 'express';
import * as businessController from './business.controller';
import { authenticate } from '@/middleware/auth';
import { requireVerified } from '@/middleware/requireVerified';
import { requireRole } from '@/middleware/roles';

const router = Router();

// Any signed-in, verified staff member can view the business profile
router.get('/', authenticate, requireVerified, businessController.getBusinessProfile);

// Only the owner can edit it
router.patch(
  '/',
  authenticate,
  requireVerified,
  requireRole('owner'),
  businessController.updateBusinessProfile,
);

export default router;