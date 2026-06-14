import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';
import { errorHandler } from '@/middleware/errorHandler';
import logger from '@/utils/logger';

import authRoutes from '@/modules/auth/auth.routes';
import onboardingRoutes from '@/modules/onboarding/onboarding.routes';
import productsRoutes from '@/modules/products/products.routes';


const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.NODE_ENV === 'production' ? 'https://myfrontend.com' : '*',
    credentials: true,
  }),
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests. Try again later.' },
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    data: {
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
});


app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);
app.use('/api/v1/products', productsRoutes);

app.use(errorHandler);

export default app;