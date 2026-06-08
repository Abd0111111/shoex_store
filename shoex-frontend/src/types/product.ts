export interface ProductColor {
  name: string;
  hex: string;
}

export interface SizeStock {
  size: number;
  stock: number;
}

export type ProductStatus =
  | "Active"
  | "Draft"
  | "Archived";

export interface Product {
  id: string;

  name: string;
  brand: string;

  price: number;
  originalPrice?: number;

  images: string[];
  backgroundImageIndex?: number;

  category: string;

  sizes: number[];
  sizeStocks?: SizeStock[];

  colors: ProductColor[];

  description: string;

  rating: number;
  reviewCount: number;

  inStock: boolean;
  stock: number;

  tags: string[];

  sku?: string;

  featured?: boolean;

  status?: ProductStatus;

  weight?: number;
  dimensions?: string;
}