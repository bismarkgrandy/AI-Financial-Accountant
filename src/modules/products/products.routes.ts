import { Router } from 'express';
import multer from 'multer';
import * as productsController from './products.controller';
import { authenticate } from '@/middleware/auth';
import { requireRole } from '@/middleware/roles';
import { requireVerified } from '@/middleware/requireVerified';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

router.use(authenticate);
router.use(requireVerified);

router.get('/', productsController.listProducts);
router.get('/import-template', productsController.getImportTemplate);
router.get('/:id', productsController.getProduct);

router.post(
  '/',
  requireRole('owner', 'manager'),
  productsController.createProduct,
);
router.post(
  '/import',
  requireRole('owner', 'manager'),
  upload.single('file'),
  productsController.importProducts,
);
router.patch(
  '/:id',
  requireRole('owner', 'manager'),
  productsController.updateProduct,
);
router.delete(
  '/:id',
  requireRole('owner', 'manager'),
  productsController.deactivateProduct,
);

export default router;
