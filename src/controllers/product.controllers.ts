import type { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/product.service";
import {
  createProductSchema,
  querySchema,
  updateProductSchema,
} from "../validators/product.validator";

const service = new ProductService();

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { body } = createProductSchema.parse({ body: req.body });
  try {
    const product = await service.createProduct(body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params } = updateProductSchema.parse({
    params: req.params,
    body: {},
  });
  try {
    const { id } = params;
    const data = await service.getProductById(id);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getProductsOffset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { query } = querySchema.parse({ query: req.query });
  try {
    const parsedLimit = Number(query.limit) || 10;
    const parsedPage = Number(query.page) || 1;
    const data = await service.getProductsOffset(parsedPage, parsedLimit);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getProductsCursor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { query } = querySchema.parse({ query: req.query });
  try {
    const parsedLimit = Number(query.limit) || 10;
    const parsedCursor = (query.cursor as string) || undefined;
    const data = await service.getProductsCursor(parsedLimit, parsedCursor);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params } = updateProductSchema.parse({
    params: req.params,
    body: req.body,
  });
  try {
    const { id } = params;
    const data = await service.updateProduct(id, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { params } = updateProductSchema.parse({
    params: req.params,
    body: {},
  });
  try {
    const { id } = params;
    const data = await service.deleteProduct(id);
    res.json(data);
  } catch (error) {
    next(error);
  }
};
