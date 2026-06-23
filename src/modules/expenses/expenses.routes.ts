import { Router } from 'express';
import * as expenseController from './expenses.controller';
import { authenticate } from '@/middleware/auth';
import { requireOnboarding } from '@/middleware/requireOnboarding';
import { requireVerified } from '@/middleware/requireVerified';
const router = Router();

router.use(authenticate);
router.use(requireVerified);

router.post('/', requireOnboarding, expenseController.createExpense);
router.get('/', expenseController.listExpenses);

export default router;