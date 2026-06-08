import api from "./api";
import type { User } from "@/types/user";

interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User & { isOwner?: boolean };
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post("/auth/login", { email, password });
    return data.data;
  },

  register: async (
    name: string,
    email: string,
    password: string,
    phone?: string
  ): Promise<AuthResponse> => {
    const { data } = await api.post("/auth/register", {
      name,
      email,
      password,
      ...(phone && { phone }),
    });
    return data.data;
  },

  googleAuth: async (idToken: string): Promise<AuthResponse> => {
    const { data } = await api.post("/auth/google", { idToken });
    return data.data;
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout").catch(() => {}); // fire and forget
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get("/auth/me");
    return data.data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post("/auth/forgot-password", { email });
  },

  resetPassword: async (
    resetToken: string,
    newPassword: string
  ): Promise<void> => {
    await api.post("/auth/reset-password", { resetToken, newPassword });
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string
  ): Promise<void> => {
    await api.post("/admin/settings/security/change-password", {
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
  },

  getMyOrders: async (): Promise<any[]> => {
    const { data } = await api.get("/users/me/orders");
    return data.data;
  },

  getWishlist: async (): Promise<any[]> => {
    const { data } = await api.get("/users/me/wishlist");
    return data.data;
  },

  addToWishlist: async (productId: string): Promise<any> => {
    const { data } = await api.post("/users/me/wishlist", { productId });
    return data.data;
  },

  removeFromWishlist: async (productId: string): Promise<any> => {
    const { data } = await api.delete(`/users/me/wishlist/${productId}`);
    return data.data;
  },

  getAddress: async (): Promise<any> => {
    const { data } = await api.get("/users/me/address");
    return data.data;
  },

  updateAddress: async (addressData: any): Promise<any> => {
    const { data } = await api.put("/users/me/address", addressData);
    return data.data;
  },

  deleteAddress: async (): Promise<any> => {
    const { data } = await api.delete("/users/me/address");
    return data.data;
  },
};