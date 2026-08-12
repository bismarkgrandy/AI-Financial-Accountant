import { Router } from 'express';
import * as aiController from './ai.controller';
import { authenticate } from '@/middleware/auth';
import { requireVerified } from '@/middleware/requireVerified';

const router = Router();

router.use(authenticate);
router.use(requireVerified);

router.post('/ask', aiController.askAi);
router.get('/conversations', aiController.listConversations);
router.get('/conversations/:id', aiController.getConversation);
router.patch('/conversations/:id', aiController.updateConversation);
router.delete('/conversations/:id', aiController.deleteConversation);

export default router;