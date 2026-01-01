export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  stock: number;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
}
