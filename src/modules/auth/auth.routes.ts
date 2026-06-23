import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from './auth.controller';
import { authenticate } from '@/middleware/auth';
import { env } from '@/config/env';

const router = Router();

// Rate-limit endpoints that send emails (prevent abuse/cost)
const otpEmailLimiter = rateLimit({
  windowMs: env.OTP_RESEND_WINDOW_MINUTES * 60 * 1000,
  max: env.OTP_RESEND_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfterSec = Number(res.getHeader('Retry-After')) || 0;
    const minutes = Math.ceil(retryAfterSec / 60);
    res.status(429).json({
      success: false,
      message: minutes > 1
        ? `Too many requests. Please try again in about ${minutes} minutes.`
        : 'Too many requests. Please try again in about a minute.',
    });
  },
});

// Public
router.post('/signup', otpEmailLimiter, authController.signup);
router.post('/login', authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', otpEmailLimiter, authController.resendVerification);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', otpEmailLimiter, authController.forgotPassword);
router.post('/reset-password', otpEmailLimiter, authController.resetPassword);

// Protected — needs a valid access token
router.post('/logout-all', authenticate, authController.logoutAll);

export default router;