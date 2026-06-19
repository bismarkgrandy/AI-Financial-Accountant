import { Prisma } from '@prisma/client';
import prisma from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { CreateProductInput, UpdateProductInput } from './products.schemas';

export const createProduct = async (
  businessId: string,
  userId: string,
  input: CreateProductInput,
) => {
  // If a category is given, verify it belongs to THIS business
  if (input.categoryId) {
    const category = await prisma.productCategory.findFirst({
      where: { id: input.categoryId, businessId },
    });
    if (!category) {
      throw new AppError('Category not found', 404);
    }
  }

  // ── Layer 1: Pre-check — friendly duplicate-SKU response ──
  // Only runs when an SKU is provided. Returns the existing product
  // so the frontend can offer "restock this one instead".
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

  // ── Create, with Layer 2: constraint backstop (catches races) ──
  try {
    const product = await prisma.product.create({
      data: {
        businessId,
        createdById: userId,
        name: input.name,
        sellingPrice: input.sellingPrice,
        costPrice: input.costPrice,
        currentStockQty: input.openingQty, // opening qty becomes current stock
        minimumStockQty: input.minimumStockQty,
        unitOfMeasure: input.unitOfMeasure,
        sku: input.sku?.trim() ?? null,
        categoryId: input.categoryId ?? null,
      },
    });

    return product;
  } catch (error) {
    // The DB unique constraint caught a duplicate the pre-check missed
    // (e.g. two concurrent requests racing on the same SKU)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new AppError(
        'A product with this SKU already exists.',
        409,
      );
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
      // search by name (case-insensitive contains)
      ...(filters.search
        ? { name: { contains: filters.search, mode: 'insensitive' } }
        : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      // default to active only, unless explicitly asked otherwise
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
  // Confirm the product exists and belongs to this business
  const existing = await prisma.product.findFirst({
    where: { id: productId, businessId },
  });
  if (!existing) {
    throw new AppError('Product not found', 404);
  }

  // If changing category, verify it belongs to this business
  if (input.categoryId) {
    const category = await prisma.productCategory.findFirst({
      where: { id: input.categoryId, businessId },
    });
    if (!category) {
      throw new AppError('Category not found', 404);
    }
  }

  // ── Pre-check: friendly duplicate-SKU response (only if sku is changing) ──
  // Skip the product itself — changing other fields while keeping the same
  // sku must not flag a false duplicate.
  if (input.sku && input.sku.trim().length > 0) {
    const duplicate = await prisma.product.findFirst({
      where: {
        businessId,
        sku: input.sku.trim(),
        id: { not: productId }, // exclude this product
      },
    });
    if (duplicate) {
      throw new AppError(
        `A product with SKU "${input.sku.trim()}" already exists: ${duplicate.name}.`,
        409,
      );
    }
  }

  // ── Update, with the constraint backstop (catches races) ──
  try {
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.sellingPrice !== undefined ? { sellingPrice: input.sellingPrice } : {}),
        // costPrice intentionally NOT editable here — it's the weighted
        // average maintained by purchases. Changing it requires a
        // purchase (or a future cost/stock adjustment with a journal
        // entry), never a plain edit, to keep the Stock account in sync.
        ...(input.minimumStockQty !== undefined ? { minimumStockQty: input.minimumStockQty } : {}),
        ...(input.unitOfMeasure !== undefined ? { unitOfMeasure: input.unitOfMeasure } : {}),
        ...(input.sku !== undefined ? { sku: input.sku?.trim() ?? null } : {}),
        ...(input.barcode !== undefined ? { barcode: input.barcode } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      },
    });

    return product;
  } catch (error) {
    // DB unique constraint caught a duplicate the pre-check missed
    // (e.g. a concurrent request that changed another product to this sku)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new AppError(
        'A product with this SKU already exists.',
        409,
      );
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

  // Soft delete — never hard delete (sales history references it)
  const product = await prisma.product.update({
    where: { id: productId },
    data: { isActive: false },
  });

  return product;
};