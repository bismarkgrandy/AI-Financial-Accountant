import { Router } from 'express';
import * as purchasesController from './purchases.controller';
import { authenticate } from '@/middleware/auth';
import { requireOnboarding } from '@/middleware/requireOnboarding';
import { requireVerified } from '@/middleware/requireVerified';

const router = Router();

router.use(authenticate);
router.use(requireVerified);
router.use(requireOnboarding);

// Recording a purchase — any authenticated user
router.post('/', purchasesController.createPurchase);

export default router;