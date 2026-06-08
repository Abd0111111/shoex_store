import type { Product } from "./product";

// ─── Order ───────────────────────────────────────────────
export type OrderStatus =
  | "New Order"
  | "Contacted"
  | "Confirmed"
  | "Packed"
  | "Shipped"
  | "Out For Delivery"
  | "Delivered"
  | "Cancelled"
  | "Returned";

export type PaymentStatus = "Paid" | "Pending" | "Failed" | "Refunded";

export type ShippingStatus = "Pending" | "In Transit" | "Delivered" | "Failed";

export interface OrderProduct {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size: number;
  color?: string;
}

export interface AdminOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  products: OrderProduct[];
  total: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  shippingAddress: string;
  trackingNumber?: string;
  transactionId?: string;
  notes?: string;
  date: string;
}

// ─── Order Status Counts (من GET /admin/orders) ──────────
export interface OrderStatusCounts {
  total: number;
  newOrders: number;
  contacted: number;
  confirmed: number;
  packed: number;
  shipped: number;
  outForDelivery: number;
  delivered: number;
  cancelled: number;
  returned: number;
}

// ─── Customer ────────────────────────────────────────────
export type CustomerStatus = "Active" | "Inactive";

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  totalOrders: number;
  lastPurchase: string;
  joinedDate: string;
  status: CustomerStatus;
}

// ─── Customer Aggregates ─────────────────────────────────
export interface CustomerAggregates {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
}

// ─── Sales / Analytics ───────────────────────────────────
export interface RevenueChartPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface PeriodStats {
  revenue: number;
  orders: number;
  avgOrderValue?: number;
  newCustomers?: number;
}

export interface SalesData {
  today: PeriodStats;
  week: PeriodStats;
  month: PeriodStats;
  pendingOrdersCount: number;
  weeklyRevenueTarget: number;
  monthlyCustomersTarget: number;
  monthlyProductsSoldTarget: number;
  productsSoldThisMonth: number;
  revenueChart: RevenueChartPoint[];
}

// ─── Analytics ───────────────────────────────────────────
export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  avgOrderValueChange: number;
}

export interface CategoryBreakdown {
  name: string;
  value: number;
  color: string;
}

export interface TopProduct {
  productId: string;
  name: string;
  sales: number;
  revenue: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  revenueChart: RevenueChartPoint[];
  categoryBreakdown: CategoryBreakdown[];
  topProducts: TopProduct[];
}

// ─── Notifications ───────────────────────────────────────
export type NotificationType =
  | "new_order"
  | "low_stock"
  | "new_review"
  | "new_customer"
  | "order_cancelled";

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

// ─── Inventory ───────────────────────────────────────────
export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku?: string;
  price: number;
  images: string[];
  stock: number;
  movement: number;
  inventoryValue: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

export interface InventoryAggregates {
  totalUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  totalSKUs: number;
}

// ─── Shipping ────────────────────────────────────────────
export interface ShippingStats {
  awaitingShipment: number;
  inTransit: number;
  delivered: number;
  failedDeliveries: number;
}

export interface ActiveShipment {
  id: string;
  customerName: string;
  shippingAddress: string;
  orderStatus: OrderStatus;
  shippingStatus: ShippingStatus;
  trackingNumber?: string;
  date: string;
}

// ─── Team ────────────────────────────────────────────────
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "viewer";
  createdAt: string;
}

// ─── Settings ────────────────────────────────────────────
export interface ShippingLocation {
  id: string;
  city: string;
  rate: number;
  deliveryDays: string;
  isCustom: boolean;
}

export interface StoreSettings {
  storeName: string;
  storeUrl: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  taxId: string;
  bizType: string;
  currency: string;
  timezone: string;
  language: string;
  prefs: {
    enableReviews: boolean;
    guestCheckout: boolean;
    orderEmails: boolean;
    newsletter: boolean;
    showOutOfStock: boolean;
    maintenanceMode: boolean;
  };
}

export interface AdminSettings {
  store: StoreSettings;
  payment: {
    stripeEnabled: boolean;
    stripeKeyMasked: string | null;
    paypalEnabled: boolean;
    paypalClientIdMasked: string | null;
    cashOnDelivery: boolean;
    testMode: boolean;
  };
  shipping: {
    freeShippingThreshold: number;
    processingDays: number;
    locations: ShippingLocation[];
  };
  notifications: {
    newOrder: boolean;
    lowStock: boolean;
    newReview: boolean;
    newCustomer: boolean;
    dailyReport: boolean;
    weeklyReport: boolean;
    emailRecipient: string;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
  };
}

// ─── Feedback ────────────────────────────────────────────
export interface AdminFeedback {
  id: string;
  orderId: string;
  customerName: string;
  feedback: string;
  createdAt: string;
}

// ─── Pagination ──────────────────────────────────────────
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}