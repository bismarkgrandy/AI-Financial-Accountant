import { Router } from 'express';
import { verifyInternalService } from '@/middleware/internalAuth';
import { requireRole } from '@/middleware/roles';

import * as reportsController from '@/modules/reports/reports.controller';
import * as usersController from '@/modules/users/users.controller';
import * as businessController from '@/modules/business/business.controller';
import * as productsController from '@/modules/products/products.controller';
import * as meController from '@/modules/me/me.controller';
import * as expensesController from '@/modules/expenses/expenses.controller';
import * as ownerController from '@/modules/owner/owner.controller';
import * as debtorsController from '@/modules/debtors/debtors.controller';
import * as creditorsController from '@/modules/creditors/creditors.controller';

const router = Router();

router.use(verifyInternalService);

// ---- Reports (computed / financial views) ----
router.get('/reports/profit-loss', reportsController.getProfitLoss);
router.get('/reports/cash-position', reportsController.getCashPosition);
router.get('/reports/debtors-summary', reportsController.getDebtorsSummary);
router.get('/reports/creditors-summary', reportsController.getCreditorsSummary);

// ---- Products ----
router.get('/products', productsController.listProducts);

// ---- Expenses ----
router.get('/expenses', expensesController.listExpenses);

// ---- Owner deposits/withdrawals ----
router.get('/owner/deposits', ownerController.listDeposits);
router.get('/owner/withdrawals', ownerController.listWithdrawals);

// ---- Debtors (identity/list — distinct from reports/debtors-summary) ----
router.get('/debtors', debtorsController.listDebtors);

// ---- Creditors (identity/list — distinct from reports/creditors-summary) ----
router.get('/creditors', creditorsController.listCreditors);

// ---- Staff ----
router.get('/users', requireRole('owner'), usersController.listUsers);
router.get('/users/invites', requireRole('owner'), usersController.listPendingInvites);

// ---- Business & self ----
router.get('/business', businessController.getBusinessProfile);
router.get('/me', meController.getMe);

export default router;