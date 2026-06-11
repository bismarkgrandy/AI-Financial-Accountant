import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from '@/middleware/auth';

const router = Router();

// Public
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Protected — needs a valid access token
router.post('/logout-all', authenticate, authController.logoutAll);

export default router;