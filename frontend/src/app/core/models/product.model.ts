export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  userId: string;
  categoryId: string;
  categoryName?: string;
  images: ProductImage[];
  createdAt?: string;
}

export interface ProductUpsert {
  name: string;
  description: string;
  price: number;
  quantity: number;
  categoryId: string;
}

export interface ProductImage {
  id?: string;
  url: string;
  file?: File;
  existing: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface ProductSearchFilter {
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: string;
  sellerId?: string;
  startDate?: string;
  endDate?: string;
}
