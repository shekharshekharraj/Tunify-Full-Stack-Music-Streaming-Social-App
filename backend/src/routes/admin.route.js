// backend/src/routes/admin.route.js
import { Router } from "express";
import {
  checkAdmin,
  createAlbum,
  createSong,
  deleteAlbum,
  deleteSong,
  isAdmin,
} from "../controller/admin.controller.js";
import { updateAlbum, updateSong } from "../controller/edit.controller.js";
import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

/** Never cache the admin probe; ensure token differences change the response */
const noCache = (_req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  // Make caches vary by auth header/token
  res.set("Vary", "Authorization");
  next();
};

/**
 * Signed-in probe (no admin gate). The frontend uses this to decide
 * whether to show the Admin Dashboard button.
 * Keep this BEFORE the requireAdmin gate and add noCache.
 */
router.get("/is-admin", protectRoute, noCache, isAdmin);

/** Admin-only routes below */
router.use(protectRoute, requireAdmin);

router.get("/check", checkAdmin);

// Songs
router.post("/songs", createSong);
router.put("/songs/:id", updateSong);
router.delete("/songs/:id", deleteSong);

// Albums
router.post("/albums", createAlbum);
router.put("/albums/:id", updateAlbum);
router.delete("/albums/:id", deleteAlbum);

export default router;
