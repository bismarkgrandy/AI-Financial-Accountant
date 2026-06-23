import { Router } from 'express';
import * as productsController from './products.controller';
import { authenticate } from '@/middleware/auth';
import { requireRole } from '@/middleware/roles';
import { requireVerified } from '@/middleware/requireVerified';

const router = Router();

// All product routes require authentication
router.use(authenticate);
router.use(requireVerified);

// Reading — any authenticated user (cashiers need to see products)
router.get('/', productsController.listProducts);
router.get('/:id', productsController.getProduct);

// Writing — owner or manager only
router.post('/', requireRole('owner', 'manager'), productsController.createProduct);
router.patch('/:id', requireRole('owner', 'manager'), productsController.updateProduct);
router.delete('/:id', requireRole('owner', 'manager'), productsController.deactivateProduct);

export default router;