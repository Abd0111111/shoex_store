import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types/user";
import { authService } from "@/services/auth.service";
import axiosClient from "@/api/axiosClient";

interface AuthStore {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setToken: (token: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setAuth: (user: User, token: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { user, token, refreshToken } = await authService.login(email, password);
        // Synchronously set header to prevent microtask race condition prior to navigation
        axiosClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        set({ user, token, refreshToken, isAuthenticated: true });
        return true;
      },

      logout: () => {
        delete axiosClient.defaults.headers.common["Authorization"];
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setToken: (token, refreshToken) => {
        axiosClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        set({ token, refreshToken });
      },

      setUser: (user) => set({ user }),

      setAuth: (user, token, refreshToken) => {
        axiosClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        set({ user, token, refreshToken, isAuthenticated: true });
      },
    }),
    { name: "shoex-auth" }
  )
);