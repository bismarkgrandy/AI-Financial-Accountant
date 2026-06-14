import { Router } from 'express';
import * as salesController from './sales.controller';
import { authenticate } from '@/middleware/auth';
import { requireOnboarding } from '@/middleware/requireOnboarding';

const router = Router();

router.use(authenticate);
router.use(requireOnboarding); // sales need onboarding done

// Any authenticated user (cashier/manager/owner) can record a sale
router.post('/', salesController.createSale);

export default router;