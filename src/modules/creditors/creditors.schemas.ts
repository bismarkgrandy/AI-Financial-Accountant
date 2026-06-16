import { z } from 'zod';

export const listCreditorsSchema = z.object({
  search: z.string().optional(),
  hasDebt: z.enum(['true', 'false']).optional(), // filter to those you owe
  isActive: z.enum(['true', 'false']).optional(),
});

export const updateCreditorSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const recordCreditorPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentMethod: z.enum(['cash', 'mtn_momo', 'telecel', 'airtel', 'bank']),
  notes: z.string().optional(),
});

export type UpdateCreditorInput = z.infer<typeof updateCreditorSchema>;
export type RecordCreditorPaymentInput = z.infer<typeof recordCreditorPaymentSchema>;