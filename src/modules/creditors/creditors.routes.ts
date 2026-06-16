import { Router } from 'express';
import * as creditorsController from './creditors.controller';
import { authenticate } from '@/middleware/auth';
import { requireOnboarding } from '@/middleware/requireOnboarding';

const router = Router();

router.use(authenticate);

router.get('/', creditorsController.listCreditors);
router.get('/:id', creditorsController.getCreditor);

router.post('/:id/payments', requireOnboarding, creditorsController.recordPayment);

router.patch('/:id', creditorsController.updateCreditor);
router.delete('/:id', creditorsController.deactivateCreditor);

export default router;