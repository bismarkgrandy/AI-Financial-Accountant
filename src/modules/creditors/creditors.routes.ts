import { Router } from 'express';
import * as creditorsController from './creditors.controller';
import { authenticate } from '@/middleware/auth';
import { requireOnboarding } from '@/middleware/requireOnboarding';
import { requireVerified } from '@/middleware/requireVerified';

const router = Router();

router.use(authenticate);
router.use(requireVerified);

router.get('/', creditorsController.listCreditors);
router.get('/:id', creditorsController.getCreditor);

router.post('/:id/payments', requireOnboarding, creditorsController.recordPayment);

router.patch('/:id', creditorsController.updateCreditor);
router.delete('/:id', creditorsController.deactivateCreditor);

export default router;