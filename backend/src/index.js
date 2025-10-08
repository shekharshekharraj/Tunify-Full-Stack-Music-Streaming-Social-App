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

import { initializeSocket } from "./lib/socket.js";
import { initPartyNamespace } from "./lib/party.socket.js";
import { connectDB } from "./lib/db.js";

import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import authRoutes from "./routes/auth.route.js";
import songRoutes from "./routes/song.route.js";
import albumRoutes from "./routes/album.route.js";
import statRoutes from "./routes/stat.route.js";
import activityRoutes from "./routes/activity.route.js";
import aiChatRoutes from "./routes/ai.chat.route.js";
import songSearchRoutes from "./routes/song.search.route.js";
import partyRoutes from "./routes/party.route.js";
import ytMusicRoute from "./routes/ytmusic.route.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

// ----- CORS -----
const normalize = (u) => (u ? u.replace(/^['"]|['"]$/g, "").replace(/\/+$/, "") : u);
const FRONTEND_URL = normalize(process.env.FRONTEND_URL);
const RENDER_URL   = normalize(process.env.RENDER_EXTERNAL_URL);

const allowedOriginsArr = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002",
  "http://localhost:5000",
  "https://www.tunify.co.in",
  FRONTEND_URL,
  RENDER_URL,
].filter(Boolean);

console.log("[cors] allowed origins:", allowedOriginsArr);

const corsConfig = {
  origin: (origin, cb) => {
    if (!origin || allowedOriginsArr.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin", "Content-Type", "Authorization", "Cache-Control",
    "X-Requested-With", "Accept",
  ],
  exposedHeaders: ["Set-Cookie"],
};

app.use(cors(corsConfig));
app.options("*", cors(corsConfig));

app.use("/api/yt", ytMusicRoute);

// ----- Security / misc -----
app.disable("x-powered-by");

// ✅ CHANGED: Strong CSP that still allows YouTube embeds; also disable COEP
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        // YouTube iframe + possible Google domains used by YT
        "frame-src": [
          "'self'",
          "https://www.youtube.com",
          "https://www.youtube-nocookie.com",
          "https://*.youtube.com",
          "https://*.google.com",
        ],
        // If you ever load the IFrame API or YT scripts
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "https://www.youtube.com",
          "https://s.ytimg.com",
          "https://*.google.com",
          "https://*.gstatic.com",
        ],
        "style-src": ["'self'", "'unsafe-inline'"],
        // thumbnails, cloudinary artwork
        "img-src": [
          "'self'",
          "data:",
          "blob:",
          "https://i.ytimg.com",
          "https://*.ytimg.com",
          "https://res.cloudinary.com",
        ],
        "media-src": ["'self'", "blob:", "https://res.cloudinary.com"],
        "connect-src": ["'self'", ...allowedOriginsArr, "https://www.youtube.com", "https://*.google.com"],
      },
    },
    crossOriginEmbedderPolicy: false, // ✅ IMPORTANT for YouTube iframe compatibility
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // ✅ allow YT popup flows
  })
);

app.use(process.env.NODE_ENV === "development" ? morgan("dev") : morgan("tiny"));
app.use(compression());
app.use(express.json({ limit: "10mb" }));

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: path.join(__dirname, "../tmp"),
  createParentPath: true,
  limits: { fileSize: 10 * 1024 * 1024 },
}));

// ----- Rate limiting (API only) -----
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true, legacyHeaders: false }));

// ----- Clerk -----
app.use(clerkMiddleware());

// ----- Health -----
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/api/healthz", (_req, res) => res.json({ ok: true }));

// ----- API -----
app.use("/api/ai", aiChatRoutes);
app.use("/api/songs", songSearchRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/stats", statRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/party", partyRoutes);

// --- Debug endpoint to inspect /party rooms (dev only) ---
app.get("/api/party/debug", (_req, res) => {
  try {
    const nsp = app.get("io")?.of?.("/party");
    if (!nsp) return res.json({ ok: false, error: "party namespace not initialized" });
    const rooms = {};
    for (const [roomId, socketsSet] of nsp.adapter.rooms) {
      rooms[roomId] = Array.from(socketsSet);
    }
    res.json({ ok: true, rooms });
  } catch (e) {
    res.json({ ok: false, error: String(e) });
  }
});

// ----- Frontend static -----
const candidates = [
  path.resolve(__dirname, "../../frontend/dist"),
  path.resolve(process.cwd(), "frontend/dist"),
  path.resolve(process.cwd(), "dist"),
];
const frontendDistPath = candidates.find((p) => fs.existsSync(p));
if (frontendDistPath) {
  console.log("Serving frontend from:", frontendDistPath);
  app.use(express.static(frontendDistPath));
  app.get("*", (_req, res) => res.sendFile(path.join(frontendDistPath, "index.html")));
} else {
  console.warn("Frontend 'dist' directory not found. Frontend will not be served.");
}

// ----- Socket.IO -----
const httpServer = createServer(app);
const io = initializeSocket(httpServer, allowedOriginsArr);
app.set("io", io);
initPartyNamespace(io);

// ----- Errors -----
app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";
  if (process.env.NODE_ENV !== "production") console.error("Error:", message);
  res.status(statusCode).json({ success: false, message });
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
  connectDB();
});
