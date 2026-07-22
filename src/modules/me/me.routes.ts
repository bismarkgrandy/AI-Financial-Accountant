import { Router } from 'express';
import * as meController from './me.controller';
import { authenticate } from '@/middleware/auth';
import { requireVerified } from '@/middleware/requireVerified';

const router = Router();

// Not requireVerified-gated — an unverified user still needs to see
// their own state (emailVerified: false) to know to go verify.
router.get('/', authenticate, meController.getMe);

router.patch('/', authenticate, requireVerified, meController.updateMe);
router.patch('/password', authenticate, requireVerified, meController.changePassword);

router.post('/email/request-change', authenticate, requireVerified, meController.requestEmailChange);
router.post('/email/confirm-change', authenticate, requireVerified, meController.confirmEmailChange);

export default router;