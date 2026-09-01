import { Router } from 'express';
import * as auditController from './audit.controller';
import { authenticate } from '@/middleware/auth';
import { requireVerified } from '@/middleware/requireVerified';

const router = Router();

router.use(authenticate);
router.use(requireVerified);

router.get('/', auditController.listAuditLogs);

export default router;
