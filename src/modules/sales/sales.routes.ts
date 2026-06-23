import { Router } from 'express';
import * as salesController from './sales.controller';
import { authenticate } from '@/middleware/auth';
import { requireOnboarding } from '@/middleware/requireOnboarding';
import { requireVerified } from '@/middleware/requireVerified';

const router = Router();

router.use(authenticate);
router.use(requireVerified);
router.use(requireOnboarding); // sales need onboarding done

// Any authenticated user (cashier/manager/owner) can record a sale
router.post('/', salesController.createSale);

export default router;