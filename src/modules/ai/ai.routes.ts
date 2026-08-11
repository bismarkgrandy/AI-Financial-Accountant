import { Router } from 'express';
import * as aiController from './ai.controller';
import { authenticate } from '@/middleware/auth';
import { requireVerified } from '@/middleware/requireVerified';

const router = Router();
router.post('/ask', authenticate, requireVerified, aiController.askAi);

export default router;