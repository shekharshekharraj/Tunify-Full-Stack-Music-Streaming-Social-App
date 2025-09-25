// src/lib/axios.ts
import axios from "axios";
import { Clerk as ClerkJS } from "@clerk/clerk-js";

let clerk: ClerkJS | null = null;
const clerkFrontendApi = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (clerkFrontendApi) {
  clerk = new ClerkJS(clerkFrontendApi);
  clerk.load().catch((e) => console.warn("Clerk load (non-fatal):", e));
}

// Prefer relative baseURL when backend serves the frontend too.
// If you *really* deploy frontend separately, set VITE_BACKEND_API_URL in that frontend’s env.
const rawBackend = import.meta.env.VITE_BACKEND_API_URL; // optional override
const normalize = (u: string) => u.replace(/\/+$/, "");
const baseURL = rawBackend ? `${normalize(rawBackend)}/api` : "/api";

export const axiosInstance = axios.create({
  baseURL,
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
