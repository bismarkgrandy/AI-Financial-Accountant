import { Router } from 'express';
import * as reportsController from './reports.controller';
import { authenticate } from '@/middleware/auth';
import { requireOnboarding } from '@/middleware/requireOnboarding';
import { requireVerified } from '@/middleware/requireVerified';

const router = Router();

router.use(authenticate);
router.use(requireVerified);

router.get('/profit-loss', requireOnboarding, reportsController.getProfitLoss);
router.get('/cash-position', requireOnboarding, reportsController.getCashPosition);
router.get('/debtors-summary', requireOnboarding, reportsController.getDebtorsSummary);
router.get('/creditors-summary', requireOnboarding, reportsController.getCreditorsSummary);

export default router;