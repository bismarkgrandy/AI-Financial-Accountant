import { Router } from 'express';
import { verifyInternalService } from '@/middleware/internalAuth';
import { requireRole } from '@/middleware/roles';

import * as reportsController from '@/modules/reports/reports.controller';
import * as usersController from '@/modules/users/users.controller';
import * as businessController from '@/modules/business/business.controller';
import * as productsController from '@/modules/products/products.controller';
import * as meController from '@/modules/me/me.controller';

const router = Router();

router.use(verifyInternalService);

router.get('/reports/profit-loss', reportsController.getProfitLoss);
router.get('/reports/cash-position', reportsController.getCashPosition);
router.get('/reports/debtors-summary', reportsController.getDebtorsSummary);
router.get('/reports/creditors-summary', reportsController.getCreditorsSummary);
router.get('/products', productsController.listProducts);
router.get('/users', requireRole('owner'), usersController.listUsers);
router.get('/business', businessController.getBusinessProfile);
router.get('/me', meController.getMe);

export default router;