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
      sku: input.sku ?? null,
      categoryId: input.categoryId ?? null,
    },
  });

  return product;
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

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.sellingPrice !== undefined ? { sellingPrice: input.sellingPrice } : {}),
      ...(input.costPrice !== undefined ? { costPrice: input.costPrice } : {}),
      ...(input.minimumStockQty !== undefined ? { minimumStockQty: input.minimumStockQty } : {}),
      ...(input.unitOfMeasure !== undefined ? { unitOfMeasure: input.unitOfMeasure } : {}),
      ...(input.sku !== undefined ? { sku: input.sku } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
    },
  });

  return product;
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