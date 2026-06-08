import type { Product, ProductColor } from "./product";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: number;
  selectedColor: ProductColor;
}