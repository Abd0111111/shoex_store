import api from "./api";
import type { AdminOrder, OrderStatus, PaymentStatus } from "@/types/admin";

// ─── Mapper ──────────────────────────────────────────
const mapOrder = (o: any): AdminOrder => ({
  ...o,
  id:            o.orderId        || o._id || o.id,
  customerName:  o.customer?.name  || o.customerName  || "Unknown",
  customerPhone: o.customer?.phone || o.customerPhone || "",
  customerEmail: o.customer?.email || o.customerEmail || "",
  shippingAddress:
    o.shippingAddress && typeof o.shippingAddress === "object"
      ? `${o.shippingAddress.address || ""}, ${o.shippingAddress.city || ""}, ${o.shippingAddress.governorate || ""}`
      : o.shippingAddress || "",
  orderStatus:    o.orderStatus   || o.status || "New Order",
  paymentStatus:  o.paymentStatus || "Pending",
  shippingStatus: o.shippingStatus || "Pending",
  total:          o.total         || o.subtotal || 0,
  date:           o.createdAt     || o.date || new Date().toISOString(),
  trackingNumber: o.trackingNumber || undefined,
  transactionId:  o.transactionId  || undefined,
  notes:          o.notes          || undefined,
  products: (o.products || o.items || []).map((p: any) => ({
    productId: p.productId || "",
    name:      p.name      || "",
    image:     p.image     || "",
    price:     p.price     || 0,
    quantity:  p.quantity  || 1,
    size:      p.size      || "",
    color:     p.color     || null,
  })),
});

export const ordersService = {
  // ─── Read ────────────────────────────────────────────
  getOrders: async (params?: {
    search?: string;
    orderStatus?: string;
    paymentStatus?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminOrder[]> => {
    const { data } = await api.get("/admin/orders", { params });
    return (data.data || []).map(mapOrder);
  },

  getOrdersWithMetadata: async (params?: {
    search?: string;
    orderStatus?: string;
    paymentStatus?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: AdminOrder[]; statusCounts: any; pagination: any }> => {
    const { data } = await api.get("/admin/orders", { params });
    return {
      data: (data.data || []).map(mapOrder),
      statusCounts: data.statusCounts,
      pagination: data.pagination,
    };
  },

  getOrderById: async (id: string): Promise<AdminOrder | undefined> => {
    const { data } = await api.get(`/admin/orders/${id}`);
    return data.data ? mapOrder(data.data) : undefined;
  },

  getOrdersByStatus: async (status: OrderStatus): Promise<AdminOrder[]> => {
    return ordersService.getOrders({ orderStatus: status });
  },

  getTodayOrders: async (): Promise<AdminOrder[]> => {
    const orders = await ordersService.getOrders();
    const today = new Date().toDateString();
    return orders.filter((o) => new Date(o.date).toDateString() === today);
  },

  // ─── Update ──────────────────────────────────────────
  updateOrderStatus: async (
    id: string,
    status: OrderStatus
  ): Promise<AdminOrder | null> => {
    const { data } = await api.patch(`/admin/orders/${id}/status`, { orderStatus: status });
    return data.data ? mapOrder(data.data) : null;
  },

  updatePaymentStatus: async (
    id: string,
    status: PaymentStatus
  ): Promise<AdminOrder | null> => {
    const { data } = await api.patch(`/admin/orders/${id}/payment-status`, { paymentStatus: status });
    return data.data ? mapOrder(data.data) : null;
  },

  updateTrackingNumber: async (
    id: string,
    trackingNumber: string
  ): Promise<AdminOrder | null> => {
    const { data } = await api.patch(`/admin/orders/${id}/tracking`, { trackingNumber });
    return data.data ? mapOrder(data.data) : null;
  },

  updateNotes: async (
    id: string,
    notes: string
  ): Promise<AdminOrder | null> => {
    const { data } = await api.patch(`/admin/orders/${id}/notes`, { notes });
    return data.data ? mapOrder(data.data) : null;
  },
};