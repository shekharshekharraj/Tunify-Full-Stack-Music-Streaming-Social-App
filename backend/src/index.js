// backend/src/index.js
import express from "express";
import dotenv from "dotenv";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createServer } from "http";
import cors from "cors";
import fileUpload from "express-fileupload";
import { clerkMiddleware } from "@clerk/express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import compression from "compression";

// NOTE: imports are from src/, so they go up one directory:
import { initializeSocket } from "../lib/socket.js";
import { connectDB } from "../lib/db.js";
import userRoutes from "../routes/user.route.js";
import adminRoutes from "../routes/admin.route.js";
import authRoutes from "../routes/auth.route.js";
import songRoutes from "../routes/song.route.js";
import albumRoutes from "../routes/album.route.js";
import statRoutes from "../routes/stat.route.js";
import activityRoutes from "../routes/activity.route.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Render proxy (cookies, Clerk)
app.set("trust proxy", 1);

// ---------- CORS ----------
const normalizeUrl = (u) => {
  if (!u) return u;
  let x = u.replace(/^['"]|['"]$/g, ""); // strip quotes if pasted
  x = x.replace(/\/+$/, "");             // strip trailing slash
  return x;
};

const FRONTEND_URL = normalizeUrl(process.env.FRONTEND_URL);
const RENDER_URL   = normalizeUrl(process.env.RENDER_EXTERNAL_URL);

// In prod (single service), calls are same-origin; CORS mainly for local dev
const allowedOriginsArr = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002",
  FRONTEND_URL,
  RENDER_URL,
].filter(Boolean);

const allowedOrigins = new Set(allowedOriginsArr);

const corsConfig = {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.has(origin)) return cb(null, true);
    return cb(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "Content-Type",
    "Authorization",
    "Cache-Control",
    "X-Requested-With",
    "Accept",
  ],
  exposedHeaders: ["Set-Cookie"],
};

app.use(cors(corsConfig));
app.options("*", cors(corsConfig));

// ---------- Security / misc ----------
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false, // enable and tune later if needed
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(process.env.NODE_ENV === "development" ? morgan("dev") : morgan("tiny"));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(
  fileUpload({
    useTempFiles: true,
    // we're inside backend/src → temp dir one level up in backend/tmp
    tempFileDir: path.join(__dirname, "../tmp"),
    createParentPath: true,
    limits: { fileSize: 10 * 1024 * 1024 },
  })
);

// ---------- Rate limit (API only) ----------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// ---------- Auth middleware (Clerk) ----------
app.use(clerkMiddleware());

// ---------- Health check ----------
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/api/healthz", (_req, res) => res.json({ ok: true }));

// ---------- API Routes ----------
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/stats", statRoutes);
app.use("/api/activity", activityRoutes);

// ---------- Frontend Static (serve built app) ----------
// We are inside backend/src, so the built frontend is ../../frontend/dist at runtime.
const candidates = [
  path.resolve(__dirname, "../../frontend/dist"),
  path.resolve(process.cwd(), "frontend/dist"),
  path.resolve(process.cwd(), "dist"),
];
const frontendDistPath = candidates.find((p) => fs.existsSync(p));

if (frontendDistPath) {
  console.log("Serving frontend from:", frontendDistPath);
  app.use(express.static(frontendDistPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  console.warn("Frontend 'dist' directory not found. Frontend will not be served.");
}

// ---------- Centralized Error Handler ----------
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";
  if (process.env.NODE_ENV !== "production") {
    console.error("Error:", message);
  }
  res.status(statusCode).json({ success: false, message });
});

// ---------- Server Init ----------
const httpServer = createServer(app);

// align Socket.IO CORS with HTTP CORS
const io = initializeSocket(httpServer, allowedOriginsArr);
app.set("io", io);

httpServer.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
  connectDB();
});
