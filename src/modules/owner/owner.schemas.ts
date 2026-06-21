import { z } from 'zod';

export const ownerEquitySchema = z.object({
  amount: z.number().positive('Amount must be greater than zero'),
  paymentMethod: z.enum(['cash', 'mtn_momo', 'telecel', 'airtel', 'bank']),
  notes: z.string().optional(),
}).strict();

export type OwnerEquityInput = z.infer<typeof ownerEquitySchema>;

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(
    (s) => {
      const d = new Date(s);
      return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
    },
    { message: 'Date must be a valid calendar date (YYYY-MM-DD)' },
  );

export const ownerListQuerySchema = z
  .object({
    from: dateString.optional(),
    to: dateString.optional(),
  })
  .refine(
    (data) => {
      const hasFrom = data.from !== undefined;
      const hasTo = data.to !== undefined;
      return hasFrom === hasTo; // both or neither
    },
    { message: 'Provide both from and to dates, or neither' },
  )
  .refine(
    (data) => {
      if (data.from && data.to) {
        return new Date(data.from) <= new Date(data.to);
      }
      return true;
    },
    { message: 'from date must be before or equal to to date' },
  );

export type OwnerListQuery = z.infer<typeof ownerListQuerySchema>;