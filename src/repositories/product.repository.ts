import { prisma } from "../config/db";
import type { Product, Prisma } from "../../prisma/generated/client";

export class ProductRepository {
  async create(data: Prisma.ProductCreateInput): Promise<Product> {
    return prisma.product.create({ data });
  }

  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({ where: { id } });
  }

  async findAllOffset(skip: number, take: number) {
    const [data, total] = await prisma.$transaction([
      prisma.product.findMany({ skip, take, orderBy: { createdAt: "desc" } }),
      prisma.product.count(),
    ]);
    return { data, total };
  }

  async findAllCursor(take: number, cursor?: string) {
    const query: Prisma.ProductFindManyArgs = {
      take: take + 1,
      orderBy: { createdAt: "desc" },
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1;
    }

    const data = await prisma.product.findMany(query);
    return data;
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.product.delete({ where: { id } });
  }
}
