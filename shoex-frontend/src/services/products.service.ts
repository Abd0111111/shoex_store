import api from "./api";
import type { Product } from "@/types/product";

const mapProduct = (p: any): Product => ({
  ...p,
  id: p._id || p.id,
});

export const productsService = {
  // ─── Read ────────────────────────────────────────────
  getProducts: async (params?: {
    search?: string;
    category?: string;
    tag?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<Product[]> => {
    const queryParams: any = { ...params };
    if (queryParams.category === "All") {
      delete queryParams.category;
    }
    const { data } = await api.get("/products", { params: queryParams });
    return (data.data || []).map(mapProduct);
  },

  getProductById: async (id: string): Promise<Product | undefined> => {
    const { data } = await api.get(`/products/${id}`);
    return data.data ? mapProduct(data.data) : undefined;
  },

  getCategories: async (): Promise<any[]> => {
    const { data } = await api.get("/products/categories");
    return data.data;
  },

  getProductsByCategory: async (category: string): Promise<Product[]> => {
    return productsService.getProducts({ category });
  },

  getProductsByTag: async (tag: string): Promise<Product[]> => {
    return productsService.getProducts({ tag });
  },

  getLowStockProducts: async (threshold = 10): Promise<Product[]> => {
    const { data } = await api.get("/admin/dashboard/low-stock", { params: { threshold } });
    return (data.data || []).map(mapProduct);
  },

  getFeaturedProducts: async (): Promise<Product[]> => {
    const products = await productsService.getProducts();
    return products.filter((p) => p.featured);
  },

  // ─── Create ──────────────────────────────────────────
  addProduct: async (
    data: Omit<Product, "id" | "rating" | "reviewCount">
  ): Promise<Product> => {
    const { rating, reviewCount, inStock, ...cleanData } = data as any;
    const { data: resData } = await api.post("/admin/products", cleanData);
    return mapProduct(resData.data);
  },

  // ─── Update ──────────────────────────────────────────
  updateProduct: async (
    id: string,
    data: Partial<Product>
  ): Promise<Product | null> => {
    const { rating, reviewCount, inStock, ...cleanData } = data as any;
    const { data: resData } = await api.put(`/admin/products/${id}`, cleanData);
    return resData.data ? mapProduct(resData.data) : null;
  },

  updateStock: async (
    id: string,
    newStock: number
  ): Promise<Product | null> => {
    const { data: resData } = await api.patch(`/admin/products/${id}/stock`, { stock: newStock });
    return resData.data ? mapProduct(resData.data) : null;
  },

  adjustStock: async (
    id: string,
    adjustment: number
  ): Promise<Product | null> => {
    const product = await productsService.getProductById(id);
    if (!product) return null;
    const newStock = Math.max(0, product.stock + adjustment);
    return productsService.updateStock(id, newStock);
  },

  applyDiscount: async (
    id: string,
    discountPercent: number
  ): Promise<Product | null> => {
    const { data: resData } = await api.patch(`/admin/products/${id}/discount`, { discountPercent });
    return resData.data ? mapProduct(resData.data) : null;
  },

  removeDiscount: async (id: string): Promise<Product | null> => {
    const { data: resData } = await api.patch(`/admin/products/${id}/discount/remove`);
    return resData.data ? mapProduct(resData.data) : null;
  },

  // ─── Delete ──────────────────────────────────────────
  deleteProduct: async (id: string): Promise<boolean> => {
    const { data } = await api.delete(`/admin/products/${id}`);
    return !!data.success;
  },

  // ─── Reviews ─────────────────────────────────────────
  getProductReviews: async (id: string, page = 1, limit = 10): Promise<any> => {
    const { data } = await api.get(`/products/${id}/reviews`, { params: { page, limit } });
    return data;
  },

  submitProductReview: async (id: string, review: { rating: number; comment: string }): Promise<any> => {
    const { data } = await api.post(`/products/${id}/reviews`, review);
    return data.data;
  },
};