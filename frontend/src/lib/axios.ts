import axios from "axios";
import { Clerk as ClerkJS } from '@clerk/clerk-js';

const clerkFrontendApi = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!clerkFrontendApi) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable.");
}

const clerk = new ClerkJS(clerkFrontendApi);
clerk.load();

export const axiosInstance = axios.create({
  // --- THE CLEANED-UP BASEURL ---
  // If VITE_BACKEND_URL is defined (e.g., on Render), use it.
  // Otherwise (e.g., local development), default to "http://localhost:5000".
  // Then, append "/api" to the chosen base URL.
  baseURL: (import.meta.env.VITE_BACKEND_URL ? import.meta.env.VITE_BACKEND_URL : "http://localhost:5000") + "/api",
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    if (clerk.loaded && clerk.session) {
      try {
        const token = await clerk.session.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Error getting Clerk token:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);