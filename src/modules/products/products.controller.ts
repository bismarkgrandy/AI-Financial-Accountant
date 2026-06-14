import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '@/types/request';
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
    const product = await productsService.createProduct(businessId, userId, input);
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