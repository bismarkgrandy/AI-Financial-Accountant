import { z } from 'zod';

const purchaseItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unitCost: z.number().min(0, 'Unit cost cannot be negative'),
});

export const createPurchaseSchema = z
  .object({
    paymentMethod: z.enum([
      'cash', 'mtn_momo', 'telecel', 'airtel', 'bank', 'credit',
    ]),
    items: z.array(purchaseItemSchema).min(1, 'A purchase must have at least one item'),

    // Credit-only: identify the supplier (existing OR new)
    creditorId: z.string().uuid().optional(),
    supplierName: z.string().optional(),
    supplierPhone: z.string().optional(),
    dueDate: z.string().optional(),

    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // Credit purchase needs a supplier: existing creditorId OR new name
      if (data.paymentMethod === 'credit') {
        const hasExisting = !!data.creditorId;
        const hasNew = !!data.supplierName && data.supplierName.trim().length > 0;
        return hasExisting || hasNew;
      }
      return true;
    },
    {
      message:
        'Credit purchases require a supplier: select an existing one (creditorId) or provide a supplier name',
      path: ['supplierName'],
    },
  );

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;