import { z } from 'zod';

export const listDebtorsSchema = z.object({
  search: z.string().optional(),
  hasDebt: z.enum(['true', 'false']).optional(), // filter to those who owe
  isActive: z.enum(['true', 'false']).optional(),
});

export const updateDebtorSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const recordPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentMethod: z.enum(['cash', 'mtn_momo', 'telecel', 'airtel', 'bank']),
  notes: z.string().optional(),
});

export type UpdateDebtorInput = z.infer<typeof updateDebtorSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;