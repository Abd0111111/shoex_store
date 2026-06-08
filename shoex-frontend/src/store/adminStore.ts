// src/store/adminStore.ts
import { create } from "zustand";
import { productsService } from "@/services/products.service";
import { ordersService } from "@/services/orders.service";
import { adminService } from "@/services/admin.service";
import type { Product } from "@/types/product";
import type { AdminOrder, AdminCustomer, SalesData, OrderStatus, PaymentStatus } from "@/types/admin";

interface AdminStore {
  // ── State ─────────────────────────────────────────────
  products:  Product[];
  orders:    AdminOrder[];
  customers: AdminCustomer[];
  salesData: SalesData | null;
  loading:   boolean;

  // ── Products ──────────────────────────────────────────
  fetchProducts:   () => Promise<void>;
  addProduct:      (product: Omit<Product, "id">) => Promise<void>;
  updateProduct:   (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct:   (id: string) => Promise<void>;
  updateStock:     (id: string, newStock: number) => Promise<void>;
  applyDiscount:   (id: string, percent: number) => Promise<void>;
  removeDiscount:  (id: string) => Promise<void>;

  // ── Orders ────────────────────────────────────────────
  fetchOrders:           () => Promise<void>;
  updateOrderStatus:     (id: string, status: OrderStatus)  => Promise<void>;
  updatePaymentStatus:   (id: string, status: PaymentStatus) => Promise<void>;
  updateTrackingNumber:  (id: string, tracking: string)     => Promise<void>;
  updateNotes:           (id: string, notes: string)        => Promise<void>;

  // ── Customers ─────────────────────────────────────────
  fetchCustomers:       () => Promise<void>;
  updateCustomerStatus: (id: string, status: AdminCustomer["status"]) => Promise<void>;

  // ── Analytics ─────────────────────────────────────────
  fetchSalesData: () => Promise<void>;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  products:  [],
  orders:    [],
  customers: [],
  salesData: null,
  loading:   false,

  // ── Products ──────────────────────────────────────────
  fetchProducts: async () => {
    const products = await productsService.getProducts();
    set({ products });
  },

  addProduct: async (data) => {
    const newProduct = await productsService.addProduct(data);
    set((s) => ({ products: [...s.products, newProduct] }));
  },

  updateProduct: async (id, data) => {
    const updated = await productsService.updateProduct(id, data);
    if (!updated) return;
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? updated : p)),
    }));
  },

  deleteProduct: async (id) => {
    await productsService.deleteProduct(id);
    set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
  },

  updateStock: async (id, newStock) => {
    const updated = await productsService.updateStock(id, newStock);
    if (!updated) return;
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? updated : p)),
    }));
  },

  applyDiscount: async (id, percent) => {
    const updated = await productsService.applyDiscount(id, percent);
    if (!updated) return;
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? updated : p)),
    }));
  },

  removeDiscount: async (id) => {
    const updated = await productsService.removeDiscount(id);
    if (!updated) return;
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? updated : p)),
    }));
  },

  // ── Orders ────────────────────────────────────────────
  fetchOrders: async () => {
    const orders = await ordersService.getOrders();
    set({ orders });
  },

  updateOrderStatus: async (id, status) => {
    const updated = await ordersService.updateOrderStatus(id, status);
    if (!updated) return;
    set((s) => ({
      orders: s.orders.map((o) => (o.id === id ? updated : o)),
    }));
  },

  updatePaymentStatus: async (id, status) => {
    const updated = await ordersService.updatePaymentStatus(id, status);
    if (!updated) return;
    set((s) => ({
      orders: s.orders.map((o) => (o.id === id ? updated : o)),
    }));
  },

  updateTrackingNumber: async (id, tracking) => {
    const updated = await ordersService.updateTrackingNumber(id, tracking);
    if (!updated) return;
    set((s) => ({
      orders: s.orders.map((o) => (o.id === id ? updated : o)),
    }));
  },

  updateNotes: async (id, notes) => {
    const updated = await ordersService.updateNotes(id, notes);
    if (!updated) return;
    set((s) => ({
      orders: s.orders.map((o) => (o.id === id ? updated : o)),
    }));
  },

  // ── Customers ─────────────────────────────────────────
  fetchCustomers: async () => {
    const customers = await adminService.getCustomers();
    set({ customers });
  },

  updateCustomerStatus: async (id, status) => {
    const updated = await adminService.updateCustomerStatus(id, status);
    if (!updated) return;
    set((s) => ({
      customers: s.customers.map((c) => (c.id === id ? updated : c)),
    }));
  },

  // ── Analytics ─────────────────────────────────────────
  fetchSalesData: async () => {
    const salesData = await adminService.getSalesData();
    set({ salesData });
  },
}));