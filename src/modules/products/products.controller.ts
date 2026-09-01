import { Request, Response, NextFunction } from 'express';
import { parse } from 'csv-parse/sync';
import { AuthRequest } from '@/types/request';
import { AppError } from '@/middleware/errorHandler';
import * as productsService from './products.service';
import {
  createProductSchema,
  updateProductSchema,
  listProductsSchema,
} from './products.schemas';
import { sendSuccess, sendCreated } from '@/utils/response';

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { businessId, userId } = req as AuthRequest;
    const input = createProductSchema.parse(req.body);
    const product = await productsService.createProduct(
      businessId,
      userId,
      input,
    );
    sendCreated(res, product);
  } catch (error) {
    next(error);
  }
};

export const listProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { businessId } = req as AuthRequest;
    const filters = listProductsSchema.parse(req.query);
    const products = await productsService.listProducts(businessId, filters);
    sendSuccess(res, products, 200);
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { businessId } = req as AuthRequest;
    const product = await productsService.getProduct(
      businessId,
      req.params.id as string,
    );
    sendSuccess(res, product, 200);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { businessId } = req as AuthRequest;
    const input = updateProductSchema.parse(req.body);
    const product = await productsService.updateProduct(
      businessId,
      req.params.id as string,
      input,
    );
    sendSuccess(res, product, 200, 'Product updated');
  } catch (error) {
    next(error);
  }
};

export const deactivateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { businessId } = req as AuthRequest;
    const product = await productsService.deactivateProduct(
      businessId,
      req.params.id as string,
    );
    sendSuccess(res, product, 200, 'Product deactivated');
  } catch (error) {
    next(error);
  }
};

interface UploadedCsvFile {
  buffer: Buffer;
}

export const importProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { businessId, userId } = req as AuthRequest;
    const importRequest = req as Request & { file?: UploadedCsvFile };

    if (!importRequest.file) throw new AppError('No file uploaded', 400);

    const rows = parse(importRequest.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    const result = await productsService.importProducts(
      businessId,
      userId,
      rows,
    );
    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
};

// NEW — serves a blank CSV template matching importProductRowSchema
export const getImportTemplate = (req: Request, res: Response) => {
  const csvContent =
    'name,sellingPrice,costPrice,openingQty,minimumStockQty,unitOfMeasure,sku\n' +
    'Cowbell Milk 400g,25.00,20.00,50,10,piece,CWB-400\n';

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="finmind-product-template.csv"',
  );
  res.send(csvContent);
};
