import { z } from 'zod';

export const openingBalanceSchema = z.object({
  cashInHand: z.number().min(0).optional(),
  mtnMomo: z.number().min(0).optional(),
  telecel: z.number().min(0).optional(),
  airtel: z.number().min(0).optional(),
  bankBalance: z.number().min(0).optional(),
  stockValue: z.number().min(0).optional(),
  debtorsTotal: z.number().min(0).optional(),
  creditorsTotal: z.number().min(0).optional(),
});