import { z } from 'zod';

const normalizeOptionalSku = (value: unknown) => {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeNullableSku = (value: unknown) => {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sellingPrice: z.number().positive('Selling price must be greater than 0'),
  costPrice: z.number().min(0, 'Cost price cannot be negative'),
  openingQty: z
    .number()
    .min(0, 'Opening quantity cannot be negative')
    .default(0),
  minimumStockQty: z.number().min(0).default(0),
  unitOfMeasure: z.string().default('piece'),
  sku: z.preprocess(normalizeOptionalSku, z.string().optional()),
  categoryId: z.string().uuid().optional(),
});

export const updateProductSchema = z
  .object({
    name: z.string().min(1).optional(),
    sellingPrice: z.number().positive().optional(),
    minimumStockQty: z.number().min(0).optional(),
    unitOfMeasure: z.string().optional(),
    sku: z.preprocess(normalizeNullableSku, z.string().nullable().optional()),
    barcode: z.string().nullable().optional(),
    categoryId: z.string().uuid().nullable().optional(),
  })
  .strict();

export const listProductsSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

export const importProductRowSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required'),
  sellingPrice: z.coerce
    .number()
    .positive('Selling price must be greater than 0'),
  costPrice: z.coerce.number().min(0, 'Cost price cannot be negative'),
  openingQty: z.coerce
    .number()
    .min(0, 'Opening quantity cannot be negative')
    .optional()
    .default(0),
  minimumStockQty: z.coerce.number().min(0).optional().default(0),
  unitOfMeasure: z.string().trim().optional().default('piece'),
  sku: z.preprocess(normalizeOptionalSku, z.string().optional()),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ImportProductRowInput = z.infer<typeof importProductRowSchema>;
