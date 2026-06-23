import { Router } from 'express';
import * as ownerController from './owner.controller';
import { authenticate } from '@/middleware/auth';
import { requireOnboarding } from '@/middleware/requireOnboarding';
import { requireVerified } from '@/middleware/requireVerified';

const router = Router();

router.use(authenticate);
router.use(requireVerified);

router.post('/deposit', requireOnboarding, ownerController.recordDeposit);
router.post('/withdrawal', requireOnboarding, ownerController.recordWithdrawal);
router.get('/deposits', ownerController.listDeposits);
router.get('/withdrawals', ownerController.listWithdrawals);

export default router;