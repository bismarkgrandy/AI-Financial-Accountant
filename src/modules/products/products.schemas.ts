import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sellingPrice: z.number().positive('Selling price must be greater than 0'),
  costPrice: z.number().min(0, 'Cost price cannot be negative'),
  openingQty: z.number().min(0, 'Opening quantity cannot be negative').default(0),
  minimumStockQty: z.number().min(0).default(0),
  unitOfMeasure: z.string().default('piece'),
  sku: z.string().optional(),
  categoryId: z.string().uuid().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  sellingPrice: z.number().positive().optional(),
  minimumStockQty: z.number().min(0).optional(),
  unitOfMeasure: z.string().optional(),
  sku: z.string().nullable().optional(),        // nullable → can clear it
  barcode: z.string().nullable().optional(),    
  categoryId: z.string().uuid().nullable().optional(),
}).strict();

export const listProductsSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;