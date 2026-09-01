import { z } from 'zod';

const saleItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().positive('Quantity must be greater than 0'),
});

export const listSalesSchema = z.object({
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createSaleSchema = z
  .object({
    paymentMethod: z.enum([
      'cash',
      'mtn_momo',
      'telecel',
      'airtel',
      'bank',
      'credit',
    ]),
    items: z.array(saleItemSchema).min(1, 'A sale must have at least one item'),

    // Credit-only fields (one of debtorId OR customerName required for credit)
    debtorId: z.string().uuid().optional(),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    dueDate: z.string().optional(),
  })
  .refine(
    (data) => {
      // For a credit sale, we need to identify the debtor:
      // either an existing debtorId OR a customerName for a new one.
      if (data.paymentMethod === 'credit') {
        const hasExisting = !!data.debtorId;
        const hasNew =
          !!data.customerName && data.customerName.trim().length > 0;
        return hasExisting || hasNew;
      }
      return true;
    },
    {
      message:
        'Credit sales require a customer: either select an existing one (debtorId) or provide a customer name',
      path: ['customerName'],
    },
  );

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type ListSalesQuery = z.infer<typeof listSalesSchema>;
