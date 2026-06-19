import { Router } from 'express';
import * as reportsController from './reports.controller';
import { authenticate } from '@/middleware/auth';
import { requireOnboarding } from '@/middleware/requireOnboarding';

const router = Router();

router.use(authenticate);

router.get('/profit-loss', requireOnboarding, reportsController.getProfitLoss);
router.get('/cash-position', requireOnboarding, reportsController.getCashPosition);

export default router;