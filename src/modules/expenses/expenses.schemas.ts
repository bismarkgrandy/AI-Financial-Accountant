import { z } from 'zod';
import { EXPENSE_CATEGORIES } from '@/journal/postExpense';

export const createExpenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.number().positive('Amount must be greater than zero'),
  paymentMethod: z.enum(['cash', 'mtn_momo', 'telecel', 'airtel', 'bank']),
  paidTo: z.string().optional(),
  notes: z.string().optional(),
}).strict();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;