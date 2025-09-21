import axios from "axios";
import { Clerk as ClerkJS } from '@clerk/clerk-js'; 

const clerkFrontendApi = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!clerkFrontendApi) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable.");
}

const clerk = new ClerkJS(clerkFrontendApi);
clerk.load(); 

export const axiosInstance = axios.create({
	baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api",
	withCredentials: true,
});

axiosInstance.interceptors.request.use(
	async (config) => {
		// --- THE FIX IS HERE ---
		// Changed clerk.isLoaded() to the correct property: clerk.loaded
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