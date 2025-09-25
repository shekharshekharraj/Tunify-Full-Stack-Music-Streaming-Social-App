// src/lib/axios.ts
import axios from "axios";
import { Clerk as ClerkJS } from "@clerk/clerk-js";

let clerk: ClerkJS | null = null;
const clerkFrontendApi = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (clerkFrontendApi) {
  clerk = new ClerkJS(clerkFrontendApi);
  clerk.load().catch((e) => console.warn("Clerk load (non-fatal):", e));
}

const normalize = (u: string) => u.replace(/\/+$/, "");

// ✅ If VITE_BACKEND_API_URL is set, use it; otherwise use same-origin "/api"
const rawBackend =
  import.meta.env.VITE_BACKEND_API_URL
    ? `${normalize(import.meta.env.VITE_BACKEND_API_URL)}/api`
    : "/api";

export const axiosInstance = axios.create({
  baseURL: rawBackend,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      if (clerk && (clerk as any).loaded && (clerk as any).session) {
        const token = await (clerk as any).session.getToken();
        if (token) {
          config.headers = config.headers ?? {};
          (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
        }
      }
    } catch (e) {
      console.warn("Clerk token attach failed (non-fatal):", e);
    }
    return config;
  },
  (e) => Promise.reject(e)
);
