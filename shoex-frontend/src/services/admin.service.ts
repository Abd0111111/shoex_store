import api from "./api";
import type { AdminCustomer } from "@/types/admin";

export const adminService = {
  // ─── Customers ───────────────────────────────────────
  getCustomers: async (params?: {
    search?: string;
    status?: string;
    sortBy?: string;
    sortDir?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminCustomer[]> => {
    const { data } = await api.get("/admin/customers", { params });
    return data.data;
  },

  getCustomerById: async (id: string): Promise<AdminCustomer | undefined> => {
    const customers = await adminService.getCustomers();
    return customers.find((c) => c.id === id);
  },

  updateCustomerStatus: async (
    id: string,
    status: AdminCustomer["status"]
  ): Promise<AdminCustomer | null> => {
    const { data } = await api.patch(`/admin/customers/${id}/status`, { status });
    return data.data;
  },

  // ─── Analytics ───────────────────────────────────────
  getSalesData: async (range = "30"): Promise<any> => {
    const { data } = await api.get("/admin/analytics", { params: { range } });
    return data.data;
  },

  // ─── Dashboard Stats & Alerts ────────────────────────
  getDashboardStats: async (): Promise<any> => {
    const { data } = await api.get("/admin/dashboard/stats");
    return data.data;
  },

  getRecentOrders: async (): Promise<any[]> => {
    const { data } = await api.get("/admin/dashboard/recent-orders");
    return data.data || [];
  },

  getLowStock: async (threshold = 10): Promise<any[]> => {
    const { data } = await api.get("/admin/dashboard/low-stock", { params: { threshold } });
    return data.data || [];
  },

  // ─── Settings ────────────────────────────────────────
  getSettings: async (): Promise<any> => {
    const { data } = await api.get("/admin/settings");
    return data.data;
  },

  updateStoreSettings: async (store: any): Promise<any> => {
    const { data } = await api.put("/admin/settings/store", store);
    return data.data;
  },

  updatePaymentSettings: async (payment: any): Promise<any> => {
    const { data } = await api.put("/admin/settings/payment", payment);
    return data.data;
  },

  updateShippingSettings: async (shipping: any): Promise<any> => {
    const { data } = await api.put("/admin/settings/shipping", shipping);
    return data.data;
  },

  updateNotificationSettings: async (notifications: any): Promise<any> => {
    const { data } = await api.put("/admin/settings/notifications", notifications);
    return data.data;
  },

  changePassword: async (payload: any): Promise<any> => {
    const { data } = await api.post("/admin/settings/security/change-password", payload);
    return data.data;
  },

  update2FA: async (enabled: boolean): Promise<any> => {
    const { data } = await api.put("/admin/settings/security/2fa", { enabled });
    return data.data;
  },

  updateSessionTimeout: async (timeoutMinutes: number): Promise<any> => {
    const { data } = await api.put("/admin/settings/security/session-timeout", { timeoutMinutes });
    return data.data;
  },

  // ─── Team ────────────────────────────────────────────
  getTeam: async (): Promise<any[]> => {
    const { data } = await api.get("/admin/team");
    return data.data || [];
  },

  addTeamMember: async (member: any): Promise<any> => {
    const { data } = await api.post("/admin/team", member);
    return data.data;
  },

  updateTeamMember: async (id: string, member: any): Promise<any> => {
    const { data } = await api.put(`/admin/team/${id}`, member);
    return data.data;
  },

  deleteTeamMember: async (id: string): Promise<any> => {
    const { data } = await api.delete(`/admin/team/${id}`);
    return data.data;
  },
};