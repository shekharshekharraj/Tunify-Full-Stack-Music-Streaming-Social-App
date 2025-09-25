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
const rawBackend =
  import.meta.env.VITE_BACKEND_URL ??
  import.meta.env.VITE_BACKEND_API_URL ?? // fallback to your old var if present
  "http://localhost:5000";

export const axiosInstance = axios.create({
  baseURL: `${normalize(rawBackend)}/api`,
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
