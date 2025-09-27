// src/lib/axios.ts
import axios from "axios";

/**
 * IMPORTANT:
 * Do not instantiate a new ClerkJS client here. Use the instance mounted by <ClerkProvider>,
 * which is available at window.Clerk. That instance knows the current session.
 */

const normalize = (u: string) => u.replace(/\/+$/, "");

// Prefer VITE_BACKEND_API_URL; if missing and we're on localhost, default to 5000; else same-origin "/api"
const envBase = import.meta.env.VITE_BACKEND_API_URL?.trim();
const baseURL =
  envBase
    ? `${normalize(envBase)}/api`
    : (location.origin.startsWith("http://localhost")
        ? "http://localhost:5000/api"
        : "/api");

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

// Attach Clerk bearer token from the provider instance (window.Clerk)
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const w: any = window as any;
      const token = await w?.Clerk?.session?.getToken?.();
      if (token) {
        config.headers = config.headers ?? {};
        (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("Clerk token attach failed (non-fatal):", e);
    }
    return config;
  },
  (e) => Promise.reject(e)
);
