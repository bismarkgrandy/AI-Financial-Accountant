import { Router } from 'express';
import * as expenseController from './expenses.controller';
import { authenticate } from '@/middleware/auth';
import { requireOnboarding } from '@/middleware/requireOnboarding';
const router = Router();

router.use(authenticate);

router.post('/', requireOnboarding, expenseController.createExpense);
router.get('/', expenseController.listExpenses);

export default router;