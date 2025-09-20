import { Router } from "express";
import { checkAdmin, createAlbum, createSong, deleteAlbum, deleteSong } from "../controller/admin.controller.js";
import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";
import { updateAlbum, updateSong } from "../controller/edit.controller.js";

const router = Router();

router.use(protectRoute, requireAdmin);

router.get("/check", checkAdmin);

// Song routes
router.post("/songs", createSong);
router.delete("/songs/:id", deleteSong);
router.put("/songs/:id", updateSong); // New edit route for songs

// Album routes
router.post("/albums", createAlbum);
router.delete("/albums/:id", deleteAlbum);
router.put("/albums/:id", updateAlbum); // New edit route for albums

export default router;