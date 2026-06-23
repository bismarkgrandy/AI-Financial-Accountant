import { Router } from 'express';
import * as debtorsController from './debtors.controller';
import { authenticate } from '@/middleware/auth';
import { requireOnboarding } from '@/middleware/requireOnboarding';
import { requireVerified } from '@/middleware/requireVerified';

const router = Router();

router.use(authenticate);
router.use(requireVerified);

router.get('/', debtorsController.listDebtors);
router.get('/:id', debtorsController.getDebtor);

router.post('/:id/payments', requireOnboarding, debtorsController.recordPayment);

router.patch('/:id', debtorsController.updateDebtor);
router.delete('/:id', debtorsController.deactivateDebtor);

export default router;