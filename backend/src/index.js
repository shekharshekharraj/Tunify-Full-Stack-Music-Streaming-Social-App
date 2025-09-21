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
import { connectDB } from "./lib/db.js";
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
const allowedOrigins = [
	"http://localhost:3000", "http://localhost:3001",
	"http://localhost:3002", "http://localhost:3003",
	process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(helmet());
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use("/api", limiter);
app.use(morgan("dev"));
app.use(express.json());
app.use(fileUpload({ useTempFiles: true, tempFileDir: path.join(__dirname, "tmp"), createParentPath: true, limits: { fileSize: 10 * 1024 * 1024 } }));

// --- THE FIX IS HERE ---
// Apply Clerk middleware globally to all routes that follow.
app.use(clerkMiddleware());
// --- END OF FIX ---

// --- Routes ---
// Now, none of the routes below need clerkMiddleware() specified individually.
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