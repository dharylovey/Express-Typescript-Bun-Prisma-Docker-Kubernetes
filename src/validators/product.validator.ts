import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    description: z.string().optional(),
    price: z.number().positive(),
    stock: z.number().int().nonnegative(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(3).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().nonnegative().optional(),
  }),
});

export const querySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).optional(),
    limit: z.string().transform(Number).optional(),
    cursor: z.string().optional(),
  }),
});
