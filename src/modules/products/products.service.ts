import { Prisma } from '@prisma/client';
import prisma from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { CreateProductInput, UpdateProductInput } from './products.schemas';
import { importProductRowSchema } from './products.schemas';

const MAX_IMPORT_ROWS = 500;

export const createProduct = async (
  businessId: string,
  userId: string,
  input: CreateProductInput,
) => {
  if (input.categoryId) {
    const category = await prisma.productCategory.findFirst({
      where: { id: input.categoryId, businessId },
    });
    if (!category) {
      throw new AppError('Category not found', 404);
    }
  }

  if (input.sku && input.sku.trim().length > 0) {
    const existing = await prisma.product.findFirst({
      where: { businessId, sku: input.sku.trim() },
    });
    if (existing) {
      throw new AppError(
        `A product with SKU "${input.sku.trim()}" already exists: ${existing.name}. ` +
          `You can restock it instead of creating a new product.`,
        409,
      );
    }
  }

  try {
    const product = await prisma.product.create({
      data: {
        businessId,
        createdById: userId,
        name: input.name,
        sellingPrice: input.sellingPrice,
        costPrice: input.costPrice,
        currentStockQty: input.openingQty,
        minimumStockQty: input.minimumStockQty,
        unitOfMeasure: input.unitOfMeasure,
        sku: input.sku?.trim() ?? null,
        categoryId: input.categoryId ?? null,
      },
    });

    return product;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new AppError('A product with this SKU already exists.', 409);
    }
    throw error;
  }
};

export const listProducts = async (
  businessId: string,
  filters: { search?: string; categoryId?: string; isActive?: string },
) => {
  const products = await prisma.product.findMany({
    where: {
      businessId,
      ...(filters.search
        ? { name: { contains: filters.search, mode: 'insensitive' } }
        : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.isActive === 'false'
        ? { isActive: false }
        : filters.isActive === undefined
          ? { isActive: true }
          : { isActive: true }),
    },
    orderBy: { name: 'asc' },
  });

  return products;
};

export const getProduct = async (businessId: string, productId: string) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, businessId },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return product;
};

export const updateProduct = async (
  businessId: string,
  productId: string,
  input: UpdateProductInput,
) => {
  const existing = await prisma.product.findFirst({
    where: { id: productId, businessId },
  });
  if (!existing) {
    throw new AppError('Product not found', 404);
  }

  if (input.categoryId) {
    const category = await prisma.productCategory.findFirst({
      where: { id: input.categoryId, businessId },
    });
    if (!category) {
      throw new AppError('Category not found', 404);
    }
  }

  if (input.sku && input.sku.trim().length > 0) {
    const duplicate = await prisma.product.findFirst({
      where: {
        businessId,
        sku: input.sku.trim(),
        id: { not: productId },
      },
    });
    if (duplicate) {
      throw new AppError(
        `A product with SKU "${input.sku.trim()}" already exists: ${duplicate.name}.`,
        409,
      );
    }
  }

  try {
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.sellingPrice !== undefined ? { sellingPrice: input.sellingPrice } : {}),
        ...(input.minimumStockQty !== undefined ? { minimumStockQty: input.minimumStockQty } : {}),
        ...(input.unitOfMeasure !== undefined ? { unitOfMeasure: input.unitOfMeasure } : {}),
        ...(input.sku !== undefined ? { sku: input.sku?.trim() ?? null } : {}),
        ...(input.barcode !== undefined ? { barcode: input.barcode } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      },
    });

    return product;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new AppError('A product with this SKU already exists.', 409);
    }
    throw error;
  }
};

export const deactivateProduct = async (
  businessId: string,
  productId: string,
) => {
  const existing = await prisma.product.findFirst({
    where: { id: productId, businessId },
  });
  if (!existing) {
    throw new AppError('Product not found', 404);
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data: { isActive: false },
  });

  return product;
};

// NEW — bulk import from a parsed CSV
export const importProducts = async (
  businessId: string,
  userId: string,
  rows: Record<string, string>[],
) => {
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new AppError(`Import file has too many rows (max ${MAX_IMPORT_ROWS} per upload)`, 400);
  }

  const results = {
    created: 0,
    failed: 0,
    errors: [] as { row: number; name?: string; reason: string }[],
  };

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2; 

    const parsed = importProductRowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      results.failed++;
      results.errors.push({
        row: rowNumber,
        name: rows[i].name,
        reason: parsed.error.issues[0]?.message ?? 'Invalid row',
      });
      continue;
    }

    // Name-duplicate check — normalized, case/whitespace-insensitive.
    // This is stricter than single-create (which only checks SKU) —
    // deliberate, since bulk rows are far more likely to contain
    // accidental repeats.
    const normalizedName = parsed.data.name.trim().toLowerCase().replace(/\s+/g, ' ');

    const existingByName = await prisma.product.findFirst({
      where: {
        businessId,
        isActive: true,
        name: { equals: normalizedName, mode: 'insensitive' },
      },
    });

    if (existingByName) {
      results.failed++;
      results.errors.push({
        row: rowNumber,
        name: parsed.data.name,
        reason: `A product named "${existingByName.name}" already exists. Use restock instead, or rename this row if it's a different product.`,
      });
      continue;
    }

    try {
      await createProduct(businessId, userId, {
        name: parsed.data.name,
        sellingPrice: parsed.data.sellingPrice,
        costPrice: parsed.data.costPrice,
        openingQty: parsed.data.openingQty,
        minimumStockQty: parsed.data.minimumStockQty,
        unitOfMeasure: parsed.data.unitOfMeasure,
        sku: parsed.data.sku,
      });
      results.created++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        row: rowNumber,
        name: parsed.data.name,
        reason: error instanceof AppError ? error.message : 'Could not save this product',
      });
    }
  }

  return results;
};