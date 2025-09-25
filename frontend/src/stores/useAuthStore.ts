// src/stores/useAuthStore.ts
import { axiosInstance } from "@/lib/axios";
import { create } from "zustand";

interface AuthStore {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  checkAdminStatus: () => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAdmin: false,
  isLoading: false,
  error: null,

  checkAdminStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      // ⬇️ get a fresh Clerk token for THIS call (same pattern as your Topbar)
      const clerk = (window as any).Clerk;
      let headers: Record<string, string> = { "Cache-Control": "no-cache" };
      if (clerk?.session) {
        const token = await clerk.session.getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      }

      const ts = Date.now(); // cache buster
      const { data } = await axiosInstance.get(`/admin/is-admin?_=${ts}`, {
        headers,
        withCredentials: true,
      });

      set({ isAdmin: !!data?.isAdmin });
    } catch (error: any) {
      set({
        isAdmin: false,
        error: error?.response?.data?.message || "Failed to check admin",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => set({ isAdmin: false, isLoading: false, error: null }),
}));
