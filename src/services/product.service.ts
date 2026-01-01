import { ProductRepository } from "../repositories/product.repository";
import type { CreateProductDto, UpdateProductDto } from "../dtos/product.dto";

export class ProductService {
  private repo = new ProductRepository();

  async createProduct(data: CreateProductDto) {
    return this.repo.create(data);
  }

  async getProductsOffset(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const { data, total } = await this.repo.findAllOffset(skip, limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductsCursor(limit: number = 10, cursor?: string) {
    const items = await this.repo.findAllCursor(limit, cursor);
    const hasNextPage = items.length > limit;
    const data = hasNextPage ? items.slice(0, -1) : items;
    const nextCursor = hasNextPage ? data[data.length - 1]?.id : undefined;
    return {
      data,
      meta: {
        hasNextPage,
        nextCursor,
      },
    };
  }

  async updateProduct(id: string, data: UpdateProductDto) {
    const product = await this.repo.findById(id);
    if (!product) {
      throw new Error(`Product not found with id ${id}`);
    }
    return this.repo.update(id, data);
  }

  async deleteProduct(id: string) {
    const product = await this.repo.findById(id);
    if (!product) {
      throw new Error(`Product not found with id ${id}`);
    }
    return this.repo.delete(id);
  }
}
