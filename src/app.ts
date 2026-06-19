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
import salesRoutes from '@/modules/sales/sales.routes';
import debtorsRoutes from '@/modules/debtors/debtors.routes';
import purchasesRoutes from '@/modules/purchases/purchases.routes';
import creditorsRoutes from '@/modules/creditors/creditors.routes';
import expenseRoutes from '@/modules/expenses/expenses.routes';
import reportsRoutes from '@/modules/reports/reports.routes';



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
app.use('/api/v1/sales', salesRoutes);
app.use('/api/v1/debtors', debtorsRoutes);
app.use('/api/v1/purchases', purchasesRoutes);
app.use('/api/v1/creditors', creditorsRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/reports', reportsRoutes);


app.use(errorHandler);

export default app;