import express from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { createServer } from "http";
import cors from "cors";
import cron from "node-cron";
import fileUpload from "express-fileupload";
import { clerkMiddleware } from "@clerk/express";

// Security and Logging middleware
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

// Route and DB imports
import { initializeSocket } from "./lib/socket.js";
import { connectDB } from require("./lib/db.js"); // Changed to require for commonJS compatibility, if needed. Assuming ESM now.
import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import authRoutes from "./routes/auth.route.js";
import songRoutes from "./routes/song.route.js";
import albumRoutes from "./routes/album.route.js";
import statRoutes from "./routes/stat.route.js";

dotenv.config();

const __dirname = path.resolve();
const app = express();
const PORT = process.env.PORT || 5000;

// --- Middlewares ---

// Dynamic CORS Configuration
const allowedOrigins = [
	"http://localhost:3000", "http://localhost:3001",
	"http://localhost:3002", "http://localhost:3003",
	process.env.FRONTEND_URL,
].filter(Boolean); // Filter out any undefined/null values

app.use(cors({ origin: allowedOrigins, credentials: true }));

// --- THE FIX IS HERE ---
// Only apply the strict Content Security Policy in production
if (process.env.NODE_ENV === "production") {
	// Ensure FRONTEND_URL is defined and correctly formatted for CSP
	const frontendUrlForCsp = process.env.FRONTEND_URL ? new URL(process.env.FRONTEND_URL).origin : ''; // Get just the origin

	app.use(
		helmet({
			contentSecurityPolicy: {
				directives: {
					...helmet.contentSecurityPolicy.getDefaultDirectives(),
					// Allow scripts from 'self', Clerk's CDN, and 'unsafe-inline' (often needed for frameworks)
					"script-src": [
						"'self'",
						"'unsafe-inline'",
						"https://accounts.clerk.com",
						"https://*.clerk.accounts.dev",
					],
					// Allow workers to be created from 'blob:' URLs and Clerk's domains
					"worker-src": [
						"'self'",
						"blob:",
						"https://accounts.clerk.com",
						"https://*.clerk.accounts.dev",
					],
					// Crucial: Add Clerk telemetry and the specific frontend URL for connect-src
					"connect-src": [
						"'self'",
						"https://*.clerk.accounts.dev",
						"https://clerk-telemetry.com", // Add this for Clerk analytics
						frontendUrlForCsp, // Use the sanitized frontend URL
					].filter(Boolean), // Filter out any empty strings if frontendUrlForCsp is empty
					"img-src": [
						"'self'",
						"data:",
						"https://*.clerk.com",
						"https://i.scdn.co",
						"https://source.unsplash.com",
						"https://*.clerk.accounts.dev",
					],
					"style-src": [
						"'self'",
						"'unsafe-inline'",
						"https://accounts.clerk.com",
						"https://*.clerk.accounts.dev",
					],
					"font-src": [
						"'self'",
						"data:",
						"https://fonts.gstatic.com",
						"https://accounts.clerk.com",
						"https://*.clerk.accounts.dev",
					],
					"frame-src": [
						"'self'",
						"https://accounts.clerk.com",
						"https://*.clerk.accounts.dev",
					],
				},
			},
			crossOriginEmbedderPolicy: { policy: "credentialless" },
		})
	);
} else {
	// In development, use a less restrictive policy (often just the defaults from helmet)
	app.use(helmet());
}
// --- END OF FIX ---

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use("/api", limiter);
app.use(morgan("dev"));
app.use(express.json());
app.use(fileUpload({ useTempFiles: true, tempFileDir: path.join(__dirname, "tmp"), createParentPath: true, limits: { fileSize: 10 * 1024 * 1024 } }));

app.use(clerkMiddleware());

// --- Routes ---
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/stats", statRoutes);

// --- Production Frontend Serving ---
if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "../frontend/dist")));
	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"));
	});
}

// --- Cron Job for Temp File Cleanup ---
const tempDir = path.join(process.cwd(), "tmp");
cron.schedule("0 * * * *", () => {
	if (!fs.existsSync(tempDir)) return;
	fs.readdir(tempDir, (err, files) => {
		if (err) return console.error("Error reading temp directory:", err);
		for (const file of files) {
			fs.unlink(path.join(tempDir, file), (err) => {
				if (err) console.error(`Error deleting temp file ${file}:`, err);
			});
		}
	});
});

// --- Centralized Error Handler ---
app.use((err, req, res, next) => {
	console.error(err.stack);
	const statusCode = err.statusCode || 500;
	const message = err.message || "Internal Server Error";
	res.status(statusCode).json({ success: false, message });
});

// --- Server Initialization ---
const httpServer = createServer(app);
initializeSocket(httpServer);

httpServer.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
	connectDB();
});